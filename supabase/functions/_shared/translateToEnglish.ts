/** Detects Greek text and translates article fields into English via Lovable AI. */
export function isGreek(text: string | null | undefined): boolean {
  if (!text) return false;
  const greek = (text.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return greek >= 20 && greek > latin * 0.3;
}

export type TranslatableFields = Record<string, string | null | undefined>;

export async function translateToEnglish<T extends TranslatableFields>(fields: T, apiKey: string): Promise<T> {
  const keys = Object.keys(fields).filter((k) => fields[k]);
  const properties = Object.fromEntries(keys.map((k) => [k, { type: "string" }]));
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Translate every field into clear, professional British English for business readers. Keep Markdown formatting, links and numbers exactly. Keep names of people, companies, laws and institutions; for Greek-only names use the official English name if one exists, otherwise transliterate. Do not summarise or omit anything.",
        },
        { role: "user", content: JSON.stringify(Object.fromEntries(keys.map((k) => [k, fields[k]]))) },
      ],
      tools: [{
        type: "function",
        function: {
          name: "translated",
          parameters: { type: "object", properties, required: keys, additionalProperties: false },
        },
      }],
      tool_choice: { type: "function", function: { name: "translated" } },
    }),
  });
  if (!res.ok) throw new Error(`Translation failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Translation returned no content");
  return { ...fields, ...JSON.parse(args) };
}
