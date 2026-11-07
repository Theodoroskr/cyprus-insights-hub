import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CalendarEntry {
  date_label: string;
  event: string;
  category: string;
  source_url: string | null;
  sort_date: string | null;
}

const CALENDAR_SCHEMA = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date_label: { type: "string" },
          event: { type: "string" },
          category: { type: "string" },
          source_url: { type: ["string", "null"] },
          sort_date: { type: ["string", "null"] },
        },
        required: ["date_label", "event", "category", "source_url", "sort_date"],
        additionalProperties: false,
      },
    },
  },
  required: ["entries"],
  additionalProperties: false,
};

/** Consume the SSE stream and return the final output text. */
async function readResponsesStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const dataLines = evt
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim());
      for (const data of dataLines) {
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "response.output_text.delta" && parsed.delta) {
            text += parsed.delta;
          } else if (parsed.type === "response.completed" && parsed.response?.output_text) {
            text = parsed.response.output_text;
          }
        } catch {
          // ignore keep-alives / partial JSON
        }
      }
    }
  }
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const todayStr = new Date().toISOString().slice(0, 10);

    const prompt = `Today is ${todayStr}. List 8-12 upcoming regulatory deadlines, transposition dates, supervisory milestones and major compliance events relevant to Cyprus businesses over the next 12 months.

Cover Cyprus regulators (CySEC, Central Bank of Cyprus, MOKAS, Data Protection Commissioner, Tax Department) and EU-level bodies whose rules apply in Cyprus (EBA, ESMA, EIOPA, AMLA, ECB, European Commission).

Include topics such as: AML/CFT, MiCA, DORA, NIS2, GDPR, PSD2/PSD3, MiFID II, AIFMD, CRS/FATCA reporting, tax filing deadlines, CySEC circulars with compliance deadlines.

Rules:
- Only include events with a known or reasonably estimable date; use labels like "Jan 2027", "Q2 2027", "15 Mar 2027".
- Exclude events that are already past.
- category must be one of: AML, DORA, MiCA, GDPR, Cyber, Tax, Reporting, General.
- sort_date must be an ISO date (YYYY-MM-DD) approximating when the event occurs.
- source_url: official regulator/EU page if confidently known, otherwise null.
- event: one concise sentence, max 120 characters.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableApiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions:
          "You are a Cyprus regulatory compliance expert. Return only accurate, verifiable regulatory dates.",
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: {
          format: {
            type: "json_schema",
            name: "regulatory_calendar",
            strict: true,
            schema: CALENDAR_SCHEMA,
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const outputText = await readResponsesStream(aiResponse.body!);
    if (!outputText) throw new Error("AI returned no content");

    const parsed = JSON.parse(outputText);
    const entries: CalendarEntry[] = (parsed.entries || []).filter(
      (e: CalendarEntry) => e.date_label && e.event
    );

    if (entries.length < 4) {
      throw new Error(
        `AI returned too few entries (${entries.length}); keeping existing calendar`
      );
    }

    // Deactivate existing entries, insert the fresh set
    const { error: deactivateError } = await supabase
      .from("regulatory_calendar")
      .update({ active: false })
      .eq("active", true);
    if (deactivateError) throw deactivateError;

    const rows = entries.map((e) => ({
      date_label: e.date_label,
      event: e.event,
      category: e.category || "General",
      source_url: e.source_url || null,
      sort_date: e.sort_date || null,
      active: true,
      generated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("regulatory_calendar")
      .insert(rows);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, entries: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("update-regulatory-calendar error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
