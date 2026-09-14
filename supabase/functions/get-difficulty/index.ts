/// <reference path="../deno.d.ts" />

// Supabase Edge Function: /get-difficulty
// Adaptive Difficulty calculation based on rolling accuracy and latency

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface AttemptRecord {
  correct: boolean;
  latency_ms: number;
}

export function computeAdaptiveDifficulty(
  currentDifficulty: number,
  recentAttempts: AttemptRecord[]
): {
  nextDifficulty: number;
  accuracyRate: number;
  averageLatencyMs: number;
  itemCount: number;
  delaySeconds: number;
  hasDistractors: boolean;
} {
  if (!recentAttempts || recentAttempts.length === 0) {
    const defaultLevel = Math.max(1, Math.min(5, currentDifficulty || 1));
    return {
      nextDifficulty: defaultLevel,
      accuracyRate: 1.0,
      averageLatencyMs: 2500,
      itemCount: 2 + defaultLevel,
      delaySeconds: Math.max(3, 8 - defaultLevel),
      hasDistractors: defaultLevel >= 3,
    };
  }

  // Take the most recent 5 to 8 attempts
  const sample = recentAttempts.slice(-8);
  const correctCount = sample.filter((a) => a.correct).length;
  const accuracyRate = sample.length > 0 ? correctCount / sample.length : 1.0;
  const averageLatencyMs =
    sample.length > 0
      ? sample.reduce((sum, a) => sum + (a.latency_ms || 2500), 0) / sample.length
      : 2500;

  let nextLevel = currentDifficulty || 1;

  // Adaptive rules
  if (sample.length >= 3) {
    if (accuracyRate >= 0.8 && averageLatencyMs < 4000) {
      // High accuracy and fast latency -> advance difficulty gently
      nextLevel = Math.min(5, nextLevel + 1);
    } else if (accuracyRate < 0.5 || averageLatencyMs > 9000) {
      // Low accuracy or high latency -> decrease difficulty for gentler experience
      nextLevel = Math.max(1, nextLevel - 1);
    }
  }

  // Configure parameters based on clamped discrete level (1 to 5)
  const clampedLevel = Math.max(1, Math.min(5, nextLevel));
  const itemCount = Math.min(8, 2 + clampedLevel);
  const delaySeconds = Math.max(2, 9 - clampedLevel);
  const hasDistractors = clampedLevel >= 3;

  return {
    nextDifficulty: clampedLevel,
    accuracyRate,
    averageLatencyMs: Math.round(averageLatencyMs),
    itemCount,
    delaySeconds,
    hasDistractors,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, gameKey, currentDifficulty = 1, recentAttempts = [] } = await req.json();

    let attemptsData: AttemptRecord[] = recentAttempts;

    // If userId and gameKey provided, optionally fetch latest attempts from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (userId && gameKey && attemptsData.length === 0 && supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: sessions } = await supabase
          .from("game_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("game_key", gameKey)
          .order("started_at", { ascending: false })
          .limit(5);

        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map((s: any) => s.id);
          const { data: dbAttempts } = await supabase
            .from("attempts")
            .select("correct, latency_ms")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: false })
            .limit(8);

          if (dbAttempts && dbAttempts.length > 0) {
            attemptsData = dbAttempts.reverse().map((a: any) => ({
              correct: !!a.correct,
              latency_ms: a.latency_ms || 2500,
            }));
          }
        }
      } catch (dbErr) {
        console.warn("Could not query attempts from DB, using fallback calculation:", dbErr);
      }
    }

    const result = computeAdaptiveDifficulty(currentDifficulty, attemptsData);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
