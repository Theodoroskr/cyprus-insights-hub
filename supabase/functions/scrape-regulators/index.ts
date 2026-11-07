import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOURCES = [
  {
    key: "cysec",
    name: "CySEC — Investment Firms",
    url: "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/",
    license_type: "Investment Firm (CIF)",
    direct: true, // plain HTML cards incl. licence + HE number — parsed without Firecrawl/AI
  },
  {
    key: "cysec",
    name: "CySEC — CASPs (MiCAR)",
    url: "https://www.cysec.gov.cy/en-GB/entities/Crypto-Assets-Entities-(MiCAR)/MiCAR-CASPs/",
    license_type: "Crypto Asset Service Provider",
  },
  {
    key: "cysec",
    name: "CySEC — AIFMs",
    url: "https://www.cysec.gov.cy/en-GB/entities/aifm/authorised/",
    license_type: "Alternative Investment Fund Manager",
  },
  {
    key: "cysec",
    name: "CySEC — Administrative Service Providers",
    url: "https://www.cysec.gov.cy/en-GB/entities/asp/",
    license_type: "Administrative Service Provider",
  },
  {
    key: "cbc",
    name: "CBC — Credit Institutions",
    url: "https://www.centralbank.cy/en/licensing-supervision/banks/register-of-credit-institutions-operating-in-cyprus",
    license_type: "Credit Institution",
  },
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

async function parseCysecCards(url: string): Promise<Entity[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (BusinessHub.cy regulatory monitor)" } });
  if (!res.ok) throw new Error(`CySEC ${res.status}`);
  const html = await res.text();
  const parts = html.split(/class="card-title"/).slice(1);
  const out: Entity[] = [];
  for (const part of parts) {
    const name = decode((part.match(/>([\s\S]*?)<\/a>/) || [])[1] || "");
    const text = decode(part.slice(0, 4000));
    if (!name) continue;
    const lic = text.match(/Licence Number\s*:\s*([0-9]+\/[0-9]+)/i)?.[1];
    const reg = text.match(/Registration Number\s*:\s*HE\s*([0-9]+)/i)?.[1];
    const site = text.match(/Website\s*:\s*(\S+\.\S+)/i)?.[1];
    out.push({ entity_name: name, license_number: lic, registration_no: reg, website: site, status: "active" });
  }
  return out;
}

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
  // Registration number is the strongest identifier
  if (entity.registration_no) {
    const { data: byReg } = await supabase.from("directory_companies").select("id")
      .eq("registration_no", entity.registration_no).limit(1);
    if (byReg && byReg.length > 0) return { id: byReg[0].id, confidence: 1.0, created: false };
  }
  // Exact (case-insensitive) name match first, preferring registered companies
  const escaped = entityName.replace(/[\\%_]/g, (c) => "\\" + c);
  const { data: exact } = await supabase
    .from("directory_companies")
    .select("id, registration_no")
    .ilike("company_name", escaped)
    .order("registration_no", { ascending: true, nullsFirst: false })
    .limit(1);
  if (exact && exact.length > 0) return { id: exact[0].id, confidence: 1.0, created: false };

  // Then normalised name ("X LTD" == "X LIMITED") or a known alias, only when unique
  const { data: key } = await supabase.rpc("normalize_company_name", { _name: entityName });
  if (typeof key === "string" && key.length >= 3) {
    const { data: al } = await supabase.from("company_aliases").select("directory_company_id").eq("alias_key", key).maybeSingle();
    if (al) return { id: al.directory_company_id, confidence: 0.98, created: false };
    const { data: hits } = await supabase.from("directory_companies").select("id").eq("name_key", key).limit(2);
    if (hits && hits.length === 1 && !/\b(of|and|for)$/.test(key)) return { id: hits[0].id, confidence: 0.95, created: false };
  }

  // No match found — create new directory entry
  const slug = generateSlug(entityName) + "-" + Date.now().toString(36);
  const regulatoryFlags: Record<string, any> = {
    regulatory_flags_updated_at: new Date().toISOString(),
  };
  if (sourceKey === "cysec") {
    regulatoryFlags.cysec_licensed = true;
    regulatoryFlags.cysec_license_type = licenseType;
    regulatoryFlags.cysec_license_number = entity.license_number || null;
    regulatoryFlags.cysec_status = entity.status || "active";
  }
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

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const source = body?.source || "all";
    let toProcess = source === "all" ? SOURCES : SOURCES.filter((s) => s.key === source);
    if (typeof body?.only === "string") toProcess = toProcess.filter((s) => s.name.toLowerCase().includes(body.only.toLowerCase()));

    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const src of toProcess) {
      try {
        console.log(`Scraping: ${src.name}`);
        let entities: Entity[];
        if ((src as any).direct) {
          entities = await parseCysecCards(src.url);
        } else {
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

          const { error } = await supabase.from("regulated_entities").upsert({
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
            updated_at: new Date().toISOString(),
          }, { onConflict: "source,entity_name" });

          if (error) {
            console.error(`Upsert error for ${entity.entity_name}:`, error.message);
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
            if (src.key === "cysec") {
              updates.cysec_licensed = true;
              updates.cysec_license_type = src.license_type;
              updates.cysec_license_number = entity.license_number || null;
              updates.cysec_status = entity.status || "active";
            }
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
      JSON.stringify({ success: true, results, errors }),
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
