import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { syncCysec } from "./cysecSync.ts";
import { syncCbc } from "./cbcSync.ts";
import { resolveCompanies } from "../_shared/companyMatcher.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOURCES = [
  // CySEC and Central Bank registers are read directly by cysecSync.ts / cbcSync.ts
  {
    key: "icpac",
    name: "ICPAC — Member Firms",
    url: "https://www.icpac.org.cy/en/members/firms/",
    license_type: "Accounting Firm",
  },
  {
    key: "cifa",
    name: "CIFA — Members",
    url: "https://www.cifacyprus.org/en/members",
    license_type: "Fund Administrator / Investment Manager",
  },
  {
    key: "bar",
    name: "Cyprus Bar Association — Law Firms",
    url: "https://www.cyprusbar.org/CypriotAdvocateMembersPage.aspx",
    license_type: "Law Firm",
  },
  {
    key: "bar",
    name: "Cyprus Bar Association — Partnerships",
    url: "https://www.cyprusbar.org/DepePage.aspx",
    license_type: "Law Firm / Partnership",
  },
];

async function scrapeUrl(url: string, firecrawlKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 5000,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.data?.markdown || data?.markdown || "";
}

type Entity = { entity_name: string; license_number?: string; status?: string; address?: string; website?: string; registration_no?: string };

const decode = (t: string) => t.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

async function extractEntities(
  markdown: string,
  sourceName: string,
  licenseType: string,
  apiKey: string
): Promise<Array<{ entity_name: string; license_number?: string; status?: string; address?: string; website?: string }>> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: `Extract all regulated entities (companies, firms, institutions) listed on this ${sourceName} page. Each entity is a ${licenseType}. Extract the company name, any licence or registration number, status (active/suspended/revoked), address, and website if visible.\n\n${markdown.slice(0, 40000)}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_entities",
          description: "Extract regulated entities from the scraped page",
          parameters: {
            type: "object",
            properties: {
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    entity_name: { type: "string" },
                    license_number: { type: "string" },
                    status: { type: "string" },
                    address: { type: "string" },
                    website: { type: "string" },
                  },
                  required: ["entity_name"],
                },
              },
            },
            required: ["entities"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_entities" } },
    }),
  });

  if (!res.ok) {
    console.error("AI extraction error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments).entities || [];
  }
  return [];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function matchOrCreateInDirectory(
  entityName: string,
  entity: Entity,
  sourceKey: string,
  licenseType: string,
  supabase: any
): Promise<{ id: string; confidence: number; created: boolean }> {
  // Registration number → alias (incl. city/branch suffixes) → unique normalised name
  const [m] = await resolveCompanies(supabase, [{ name: entityName, registration_no: entity.registration_no }]);
  if (m.id) return { id: m.id, confidence: m.confidence, created: false };

  // No match found — create new directory entry
  const slug = generateSlug(entityName) + "-" + Date.now().toString(36);
  const regulatoryFlags: Record<string, any> = {
    regulatory_flags_updated_at: new Date().toISOString(),
  };
  if (sourceKey === "cbc") regulatoryFlags.cbc_supervised = true;
  if (sourceKey === "icpac") regulatoryFlags.icpac_registered = true;
  if (sourceKey === "bar") regulatoryFlags.bar_member = true;
  if (sourceKey === "cifa") regulatoryFlags.cifa_member = true;

  const { data: created, error } = await supabase
    .from("directory_companies")
    .insert({
      company_name: entityName,
      slug,
      registration_no: entity.registration_no || null,
      address: entity.address || null,
      organisation_status: "Active",
      organisation_type: licenseType,
      activity_description: licenseType,
      city: "Nicosia", // default; many regulated entities are Nicosia-based
      city_slug: "nicosia",
      ...regulatoryFlags,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to create directory entry for ${entityName}:`, error.message);
    return { id: "", confidence: 0, created: false };
  }

  console.log(`Created new directory entry for: ${entityName}`);
  return { id: created.id, confidence: 1.0, created: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || "";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const source = body?.source || "all";
    const only = typeof body?.only === "string" ? body.only : undefined;
    let toProcess = source === "all" ? SOURCES : SOURCES.filter((s) => s.key === source);
    if (only) toProcess = toProcess.filter((s) => s.name.toLowerCase().includes(only.toLowerCase()));

    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};
    let cysec: Record<string, number> | undefined;
    let cbc: Record<string, number> | undefined;

    if (source === "all" || source === "cysec") {
      const r = await syncCysec(supabase, only);
      Object.assign(results, r.results);
      Object.assign(errors, r.errors);
      cysec = r.stats;
    }
    if ((source === "all" && !only) || source === "cbc") {
      const r = await syncCbc(supabase);
      Object.assign(results, r.results);
      Object.assign(errors, r.errors);
      cbc = r.stats;
    }
    if (toProcess.length && !FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    for (const src of toProcess) {
      try {
        console.log(`Scraping: ${src.name}`);
        let entities: Entity[];
        {
          const markdown = await scrapeUrl(src.url, FIRECRAWL_API_KEY);
          if (!markdown || markdown.length < 100) {
            console.warn(`No content from ${src.name}`);
            results[src.name] = 0;
            errors[src.name] = "Page returned no readable content";
            continue;
          }
          entities = await extractEntities(markdown, src.name, src.license_type, LOVABLE_API_KEY);
        }
        console.log(`Extracted ${entities.length} entities from ${src.name}`);

        let inserted = 0;
        for (const entity of entities) {
          if (!entity.entity_name || entity.entity_name.length < 3) continue;

          const match = await matchOrCreateInDirectory(entity.entity_name, entity, src.key, src.license_type, supabase);

          if (!match.id) {
            console.warn(`Skipping ${entity.entity_name} — no match and creation failed`);
            continue;
          }

          const reRow = {
            source: src.key,
            entity_name: entity.entity_name,
            license_number: entity.license_number || null,
            license_type: src.license_type,
            status: entity.status || "active",
            address: entity.address || null,
            website: entity.website || null,
            raw_data: entity,
            matched_company_id: match.id,
            match_confidence: match.confidence,
            source_list: src.name,
            source_url: src.url,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { data: prevRe } = await supabase.from("regulated_entities").select("id")
            .eq("source", src.key).eq("license_type", src.license_type).eq("entity_name", entity.entity_name).maybeSingle();
          const { error } = prevRe
            ? await supabase.from("regulated_entities").update(reRow).eq("id", prevRe.id)
            : await supabase.from("regulated_entities").insert(reRow);

          if (error) {
            console.error(`Save error for ${entity.entity_name}:`, error.message);
            continue;
          }

          // Licensed-register entries are stored as "licensed" records only — never as warnings or sanctions
          const { data: existingRec } = await supabase.from("regulatory_records")
            .select("id").eq("regulator", src.key.toUpperCase()).eq("record_type", "licensed")
            .eq("entity_name", entity.entity_name).maybeSingle();
          if (!existingRec) {
            await supabase.from("regulatory_records").insert({
              regulator: src.key.toUpperCase(),
              record_type: "licensed",
              entity_name: entity.entity_name,
              license_number: entity.license_number || null,
              directory_company_id: match.confidence >= 0.75 ? match.id : null,
              title: `${src.license_type} — ${entity.status || "active"}`,
              status: match.confidence >= 0.75 ? "published" : "pending",
            });
          }

          // Update directory company flags if matched (not created — created already has flags)
          if (!match.created && match.confidence >= 0.75) {
            const updates: Record<string, any> = {
              regulatory_flags_updated_at: new Date().toISOString(),
            };
            if (src.key === "cbc") updates.cbc_supervised = true;
            if (src.key === "icpac") updates.icpac_registered = true;
            if (src.key === "bar") updates.bar_member = true;
            if (src.key === "cifa") updates.cifa_member = true;

            await supabase
              .from("directory_companies")
              .update(updates)
              .eq("id", match.id);
          }

          inserted++;
        }

        results[src.name] = inserted;
      } catch (err) {
        console.error(`Error scraping ${src.name}:`, err);
        results[src.name] = -1;
        errors[src.name] = err instanceof Error ? err.message : String(err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, errors, cysec, cbc }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Scrape regulators error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
