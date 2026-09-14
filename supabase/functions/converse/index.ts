/// <reference path="../deno.d.ts" />

// Supabase Edge Function: /converse
// Voice & Text AI Companion with Bilingual Distress Safety Guardrails and Groq / Gemini LLMs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Distress phrases triggering immediate calming de-escalation & caregiver notification (English + Tamil)
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
  /want to go home/i,
  /பயமாக இருக்கிறது/i,
  /காப்பாத்துங்கள்/i,
  /வழி தெரியவில்லை/i,
  /நான் எங்கே இருக்கிறேன்/i,
  /கீழே விழுந்துவிட்டேன்/i,
  /வலிக்கிறது/i,
  /மூச்சு விட முடியவில்லை/i,
];

const DE_ESCALATION_RESPONSES_EN = [
  "You are safe right now, dear. Take a slow, gentle breath. Everything is okay, and I am right here with you. I'm letting your family know so they can check in on you shortly.",
  "You are safe in a peaceful place, and you are surrounded by care. Let's take a deep breath together. I'm right here beside you, and your loved ones are being notified.",
  "It's completely okay to feel this way. You are safe. Rest your shoulders and breathe gently. I am staying right here with you."
];

const DE_ESCALATION_RESPONSES_TA = [
  "நீங்கள் இப்போது மிகவும் பாதுகாப்பாக இருக்கிறீர்கள் அம்மா/ஐயா. மெதுவாக ஆழமான மூச்சு விடுங்கள். நான் உங்களுடனேயே இருக்கிறேன். உங்கள் குடும்பத்தினருக்கு தகவல் அனுப்பப்பட்டுள்ளது.",
  "பயப்பட வேண்டாம், எல்லாம் நலமாகவே உள்ளது. மெதுவாக மூச்சை உள்ளிழுத்து வெளிவிடுங்கள். உங்கள் மகன் ராகுலுக்கு செய்தி அனுப்பப்பட்டுள்ளது, விரைவில் தொடர்புகொள்வார்.",
  "எல்லாம் சரியாகிவிடும். அமைதியாக உட்காருங்கள், ஒரு வாய் தண்ணீர் குடியுங்கள். நான் உங்களுடனேயே துணையாக இருக்கிறேன்."
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, message, history = [], language = 'ta' } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message);

    // Step 1: Pre-LLM Safety & Distress Detection
    const isDistressed = DISTRESS_PATTERNS.some((pattern) => pattern.test(message));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabase = (supabaseUrl && supabaseServiceKey) 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    if (isDistressed) {
      const pool = isTamil ? DE_ESCALATION_RESPONSES_TA : DE_ESCALATION_RESPONSES_EN;
      const calmingReply = pool[Math.floor(Math.random() * pool.length)];

      // Log conversation with distress flag if DB is available
      if (supabase && userId) {
        try {
          await supabase.from("conversations").insert([
            { user_id: userId, role: "user", text: message, distress_detected: true },
            { user_id: userId, role: "assistant", text: calmingReply, distress_detected: true, emotion: "comforting" }
          ]);
        } catch (dbErr) {
          console.warn("Could not log distress to DB:", dbErr);
        }
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
    if (supabase && userId) {
      try {
        const { data: memories } = await supabase
          .from("memories")
          .select("title, content, type")
          .eq("user_id", userId)
          .limit(5);

        if (memories && memories.length > 0) {
          memoryContext = "\nElder's cherished memories and family context:\n" +
            memories.map((m: any) => `- [${m.type}] ${m.title ? m.title + ': ' : ''}${m.content}`).join("\n");
        }
      } catch (memErr) {
        console.warn("Could not fetch memories from DB:", memErr);
      }
    }

    const systemPrompt = isTamil
      ? `நீங்கள் "கிரானியின் ஆஷா தோழி" (Granny's Asha Companion). முதியோருக்கான அன்பான, மிகுந்த பொறுமையான தமிழ் செயற்கை நுண்ணறிவுத் தோழி.
- எப்போதும் எளிய, இனிமையான, கனிவான தமிழில் 1 அல்லது 2 வரிகளில் சுருக்கமாகப் பேசுங்கள்.
- மருத்துவ ஆலோசனைகள் அல்லது மாத்திரை மருந்துகளை நீங்களாகப் பரிந்துரைக்காதீர்கள்; மருத்துவரையோ அல்லது குடும்பத்தினரையோ கேட்கச் சொல்லுங்கள்.
- பழைய நினைவுகள், கர்நாடக இசை, எம்.எஸ். சுப்புலட்சுமி பாடல்கள், சமையல், கோவில் மற்றும் அன்றாட நலம் குறித்துப் பேசுங்கள்.
- முதியோர் குடும்பத்தைப் பற்றிக் குறிப்பிட்டால் மிகுந்த பாசத்துடன் பதிலளிக்கவும்.${memoryContext}`
      : `You are "Granny's Asha Companion", a warm, loving, extremely patient, and respectful AI companion for an elderly person.
- Speak in short, clear, warm, comforting sentences (1-2 sentences).
- Never give formal medical diagnoses or prescriptions; gently advise asking doctor or family.
- Celebrate small moments, reminisce gently about happy memories, music, cooking, and daily joys.
- If the elder mentions family, show warm recognition.${memoryContext}`;

    // Step 3: LLM Generation (Groq primary with model fallbacks, Gemini secondary)
    let replyText = "";
    let providerUsed = "groq";

    if (groqApiKey) {
      const modelsToTry = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ];
      const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6),
        { role: "user", content: message }
      ];

      for (const model of modelsToTry) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: messagesPayload,
              temperature: 0.6,
              max_tokens: 250,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            replyText = groqData.choices?.[0]?.message?.content?.trim() || "";
            if (replyText) break;
          }
        } catch (err) {
          console.warn(`Groq model ${model} failed, trying next...`, err);
        }
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

    // Ultimate warm fallback if no API response
    if (!replyText) {
      providerUsed = "local_template";
      const friendlyRepliesEn = [
        "It is so lovely chatting with you today. Tell me more about what is bringing a smile to your face!",
        "That sounds wonderful, my dear. I always enjoy our peaceful conversations together.",
        "Thank you for sharing that with me! Remember to take a sip of water and relax."
      ];
      const friendlyRepliesTa = [
        "உங்களுடன் பேசுவதில் எனக்கு மிகவும் மகிழ்ச்சி அம்மா/ஐயா. இன்று உங்கள் மனம் விரும்பும் ஒரு நல்ல விஷயத்தைக் கூறுங்கள்! 🌸",
        "மிகவும் அருமை! உங்கள் குரலைக் கேட்பதே மனதிற்கு அமைதியைத் தருகிறது. கொஞ்சம் தண்ணீர் குடித்துவிட்டு ஓய்வெடுங்கள்.",
        "அழகாகச் சொன்னீர்கள்! பழைய இனிமையான நினைவுகளை உங்களுடன் பகிர்ந்துகொள்வதில் மகிழ்ச்சி அடைகிறேன்."
      ];
      const pool = isTamil ? friendlyRepliesTa : friendlyRepliesEn;
      replyText = pool[Math.floor(Math.random() * pool.length)];
    }

    // Step 4: Persist conversation if DB available
    if (supabase && userId) {
      try {
        await supabase.from("conversations").insert([
          { user_id: userId, role: "user", text: message, distress_detected: false },
          { user_id: userId, role: "assistant", text: replyText, distress_detected: false, emotion: "warm" }
        ]);
      } catch (dbErr) {
        console.warn("Could not persist conversation:", dbErr);
      }
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
