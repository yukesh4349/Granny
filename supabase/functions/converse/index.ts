// Supabase Edge Function: /converse
// Voice & Text AI Companion with Distress Safety Guardrails and Groq / Gemini LLMs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Distress phrases triggering immediate calming de-escalation & caregiver notification
const DISTRESS_PATTERNS = [
  /i am lost/i,
  /where am i/i,
  /who are you/i,
  /i am scared/i,
  /i'm frightened/i,
  /help me/i,
  /i fell/i,
  /i can't breathe/i,
  /severe pain/i,
  /someone is in my house/i,
  /i don't know where i am/i,
  /want to go home/i
];

const DE_ESCALATION_RESPONSES = [
  "You are safe right now, dear. Take a slow, gentle breath. Everything is okay, and I am right here with you. I'm letting your family know so they can check in on you shortly.",
  "You are safe in a peaceful place, and you are surrounded by care. Let's take a deep breath together. I'm right here beside you, and your loved ones are being notified.",
  "It's completely okay to feel this way. You are safe. Rest your shoulders and breathe gently. I am staying right here with you."
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, message, history = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Pre-LLM Safety & Distress Detection
    const isDistressed = DISTRESS_PATTERNS.some((pattern) => pattern.test(message));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (isDistressed) {
      const calmingReply = DE_ESCALATION_RESPONSES[Math.floor(Math.random() * DE_ESCALATION_RESPONSES.length)];

      // Log conversation with distress flag
      if (userId) {
        await supabase.from("conversations").insert([
          { user_id: userId, role: "user", text: message, distress_detected: true },
          { user_id: userId, role: "assistant", text: calmingReply, distress_detected: true, emotion: "comforting" }
        ]);
      }

      return new Response(
        JSON.stringify({
          reply: calmingReply,
          distressAlert: true,
          emotion: "comforting",
          source: "safety_guardrail"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Fetch Relevant Memories for Semantic Context
    let memoryContext = "";
    if (userId) {
      const { data: memories } = await supabase
        .from("memories")
        .select("title, content, type")
        .eq("user_id", userId)
        .limit(5);

      if (memories && memories.length > 0) {
        memoryContext = "\nElder's cherished memories and family context:\n" +
          memories.map((m) => `- [${m.type}] ${m.title ? m.title + ': ' : ''}${m.content}`).join("\n");
      }
    }

    const systemPrompt = `You are "Granny's Companion", a warm, loving, extremely patient, and respectful AI companion for an elderly person.
- Speak in short, clear, warm, comforting sentences.
- Never give formal medical diagnoses or prescriptions; if medical concerns arise, gently advise asking their doctor or family.
- Celebrate small moments, reminisce gently about happy memories, music, cooking, and daily joys.
- If the elder mentions family, show warm recognition.${memoryContext}`;

    // Step 3: LLM Generation (Groq Llama 3.3 70B as primary, Gemini as fallback)
    let replyText = "";
    let providerUsed = "groq";

    if (groqApiKey) {
      try {
        const messagesPayload = [
          { role: "system", content: systemPrompt },
          ...history.slice(-6),
          { role: "user", content: message }
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: messagesPayload,
            temperature: 0.6,
            max_tokens: 250,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          replyText = groqData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (err) {
        console.warn("Groq request failed, trying fallback...", err);
      }
    }

    // Fallback to Gemini if Groq was empty or unavailable
    if (!replyText && geminiApiKey) {
      try {
        providerUsed = "gemini";
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: `User message: ${message}` }
                  ]
                }
              ],
              generationConfig: { maxOutputTokens: 250, temperature: 0.6 }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } catch (err) {
        console.warn("Gemini fallback failed", err);
      }
    }

    // Ultimate warm fallback if no API key is configured
    if (!replyText) {
      providerUsed = "local_template";
      const friendlyReplies = [
        "It is so lovely chatting with you today. Tell me more about what is bringing a smile to your face today!",
        "That sounds wonderful, my dear. I always enjoy our peaceful conversations together.",
        "Thank you for sharing that with me! How is your day feeling so far? Remember to take a sip of water and relax."
      ];
      replyText = friendlyReplies[Math.floor(Math.random() * friendlyReplies.length)];
    }

    // Step 4: Persist conversation
    if (userId) {
      await supabase.from("conversations").insert([
        { user_id: userId, role: "user", text: message, distress_detected: false },
        { user_id: userId, role: "assistant", text: replyText, distress_detected: false, emotion: "warm" }
      ]);
    }

    return new Response(
      JSON.stringify({
        reply: replyText,
        distressAlert: false,
        emotion: "warm",
        provider: providerUsed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
