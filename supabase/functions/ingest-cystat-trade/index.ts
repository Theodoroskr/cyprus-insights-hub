import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PXWEB_API_URL =
  "https://cystatdb23px.cystat.gov.cy/pxweb/api/v1/en/8.CYSTAT-DB/8.CYSTAT-DB__External%20Trade__Foreign%20Trade%20Detailed%20Data__Imports/1041137G.px";

/**
 * Build a PXWeb JSON-stat query to fetch all products × all countries
 * for a specific year-month period like "2026M01".
 */
function buildQuery(periodCode: string) {
  return {
    query: [
      {
        code: "ΠΡΟΪΟΝ",
        selection: { filter: "item", values: ["Σύνολο"] }, // Total (all products)
      },
      {
        code: "ΧΩΡΑ",
        selection: { filter: "all", values: ["*"] }, // All countries
      },
      {
        code: "ΔΕΙΚΤΗΣ",
        selection: { filter: "item", values: ["Αξία CIF (€)"] }, // CIF Value in EUR
      },
      {
        code: "ΠΕΡΙΟΔΟΣ",
        selection: { filter: "item", values: [periodCode] },
      },
    ],
    response: { format: "json" },
  };
}

/**
 * Determine the latest period code to fetch.
 * CYSTAT publishes data ~2 months after the reference month.
 * So for April 2026 we fetch February 2026 = "2026M02".
 */
function getLatestPeriodCode(): { code: string; year: number; month: number } {
  const now = new Date();
  // Go back 2 months for the likely latest available data
  const target = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const code = `${year}M${String(month).padStart(2, "0")}`;
  return { code, year, month };
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Allow manual override via request body
    let periodOverride: string | null = null;
    try {
      const body = await req.json();
      periodOverride = body?.period || null;
    } catch {
      // No body or invalid JSON — use auto-detect
    }

    const period = periodOverride
      ? {
          code: periodOverride,
          year: parseInt(periodOverride.split("M")[0]),
          month: parseInt(periodOverride.split("M")[1]),
        }
      : getLatestPeriodCode();

    const batchId = `cystat-imports-${period.code}-${Date.now()}`;
    const periodLabel = `${MONTH_NAMES[period.month]} ${period.year}`;

    console.log(`Fetching CYSTAT imports for ${period.code}...`);

    // Log batch start
    await supabase.from("data_import_batches").insert({
      batch_id: batchId,
      source_name: "CYSTAT PXWeb",
      source_url: PXWEB_API_URL,
      import_type: "raw_import",
      status: "pending",
      records_received: 0,
      records_inserted: 0,
      records_updated: 0,
    });

    // Check if we already have data for this period
    const { data: existing } = await supabase
      .from("raw_trade_imports")
      .select("id")
      .eq("year", period.year)
      .eq("month", period.month)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update batch as skipped
      await supabase
        .from("data_import_batches")
        .update({
          status: "success",
          error_log: `Skipped: data already exists for ${period.code}`,
          finished_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Data for ${period.code} already exists. Skipping.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from PXWeb API
    const query = buildQuery(period.code);
    const pxResponse = await fetch(PXWEB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    if (!pxResponse.ok) {
      const errText = await pxResponse.text();
      console.error("PXWeb API error:", pxResponse.status, errText);

      await supabase
        .from("data_import_batches")
        .update({
          status: "failed",
          error_log: `PXWeb API returned ${pxResponse.status}: ${errText.slice(0, 500)}`,
          finished_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);

      return new Response(
        JSON.stringify({ success: false, error: `PXWeb API error: ${pxResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pxData = await pxResponse.json();

    // Parse PXWeb JSON response
    // PXWeb JSON format: { columns: [...], data: [{ key: [...], values: [...] }, ...] }
    // or JSON-stat format depending on version
    const records: Array<{
      country_name: string;
      import_value_eur: number;
    }> = [];

    if (pxData.data && Array.isArray(pxData.data)) {
      // PXWeb JSON format
      for (const row of pxData.data) {
        const countryName = row.key?.[1] || row.key?.[0] || "Unknown";
        const value = parseFloat(row.values?.[0] || "0");
        if (value > 0 && countryName !== "Σύνολο" && countryName !== "Total") {
          records.push({
            country_name: countryName,
            import_value_eur: value,
          });
        }
      }
    }

    console.log(`Parsed ${records.length} country records for ${period.code}`);

    if (records.length === 0) {
      await supabase
        .from("data_import_batches")
        .update({
          status: "failed",
          error_log: "No records parsed from PXWeb response",
          finished_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "No records parsed. The period may not be available yet.",
          period: period.code,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into raw_trade_imports
    const rawRows = records.map((r) => ({
      source_dataset_code: "1041137G",
      source_dataset_name: "Imports by Commodity and Country",
      year: period.year,
      month: period.month,
      period_label: periodLabel,
      country_name: r.country_name,
      import_value_eur: r.import_value_eur,
      source_url: PXWEB_API_URL,
      batch_id: batchId,
    }));

    const { error: insertError } = await supabase
      .from("raw_trade_imports")
      .insert(rawRows);

    if (insertError) {
      console.error("Insert error:", insertError);
      await supabase
        .from("data_import_batches")
        .update({
          status: "failed",
          error_log: insertError.message,
          finished_at: new Date().toISOString(),
        })
        .eq("batch_id", batchId);

      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Now normalize into trade_imports_clean and aggregate

    // 1. Match countries to trade_countries table
    const { data: tradeCountries } = await supabase
      .from("trade_countries")
      .select("id, country_name, country_code, eu_member");

    const countryMap = new Map(
      (tradeCountries || []).map((c) => [c.country_name.toLowerCase(), c])
    );

    // 2. Calculate total for share percentages
    const totalValue = records.reduce((sum, r) => sum + r.import_value_eur, 0);

    // 3. Insert clean records
    const cleanRows = records.map((r) => {
      const matched = countryMap.get(r.country_name.toLowerCase());
      return {
        year: period.year,
        month: period.month,
        date_month: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
        period_label: periodLabel,
        country_id: matched?.id || null,
        hs_code: null,
        hs_description: "Total Imports",
        sector_name: "Total",
        sector_group: "Total",
        import_value_eur: r.import_value_eur,
      };
    });

    await supabase.from("trade_imports_clean").insert(cleanRows);

    // 4. Insert country monthly aggregates
    const sortedByValue = [...records].sort(
      (a, b) => b.import_value_eur - a.import_value_eur
    );

    const countryMonthlyRows = sortedByValue.map((r, i) => {
      const matched = countryMap.get(r.country_name.toLowerCase());
      return {
        year: period.year,
        month: period.month,
        date_month: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
        country_id: matched?.id || null,
        total_imports_eur: r.import_value_eur,
        country_share_pct: totalValue > 0
          ? Math.round((r.import_value_eur / totalValue) * 10000) / 100
          : 0,
        rank_position: i + 1,
      };
    });

    await supabase.from("trade_country_monthly").insert(countryMonthlyRows);

    // 5. Insert monthly total
    // Get previous month for MoM growth
    const prevMonth = period.month === 1 ? 12 : period.month - 1;
    const prevYear = period.month === 1 ? period.year - 1 : period.year;
    const { data: prevMonthData } = await supabase
      .from("trade_monthly_totals")
      .select("total_imports_eur")
      .eq("year", prevYear)
      .eq("month", prevMonth)
      .maybeSingle();

    const { data: prevYearData } = await supabase
      .from("trade_monthly_totals")
      .select("total_imports_eur")
      .eq("year", period.year - 1)
      .eq("month", period.month)
      .maybeSingle();

    const momGrowth = prevMonthData?.total_imports_eur
      ? Math.round(
          ((totalValue - prevMonthData.total_imports_eur) /
            prevMonthData.total_imports_eur) *
            10000
        ) / 100
      : null;

    const yoyGrowth = prevYearData?.total_imports_eur
      ? Math.round(
          ((totalValue - prevYearData.total_imports_eur) /
            prevYearData.total_imports_eur) *
            10000
        ) / 100
      : null;

    await supabase.from("trade_monthly_totals").insert({
      year: period.year,
      month: period.month,
      date_month: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
      total_imports_eur: totalValue,
      mom_growth_pct: momGrowth,
      yoy_growth_pct: yoyGrowth,
    });

    // 6. Build KPI snapshot
    const top5Share = sortedByValue
      .slice(0, 5)
      .reduce((sum, r) => sum + r.import_value_eur, 0);

    const euTotal = records
      .filter((r) => {
        const matched = countryMap.get(r.country_name.toLowerCase());
        return matched?.eu_member;
      })
      .reduce((sum, r) => sum + r.import_value_eur, 0);

    const topCountryMatch = countryMap.get(
      sortedByValue[0]?.country_name.toLowerCase()
    );

    await supabase.from("trade_kpi_snapshots").insert({
      date_month: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
      total_imports_eur: totalValue,
      mom_growth_pct: momGrowth,
      yoy_growth_pct: yoyGrowth,
      top_import_country_id: topCountryMatch?.id || null,
      top_import_country_value_eur: sortedByValue[0]?.import_value_eur || 0,
      top_5_countries_share_pct:
        totalValue > 0
          ? Math.round((top5Share / totalValue) * 10000) / 100
          : 0,
      eu_share_pct:
        totalValue > 0
          ? Math.round((euTotal / totalValue) * 10000) / 100
          : 0,
      non_eu_share_pct:
        totalValue > 0
          ? Math.round(((totalValue - euTotal) / totalValue) * 10000) / 100
          : 0,
    });

    // Update batch status
    await supabase
      .from("data_import_batches")
      .update({
        status: "success",
        records_received: records.length,
        records_inserted: records.length,
        finished_at: new Date().toISOString(),
      })
      .eq("batch_id", batchId);

    console.log(
      `Successfully imported ${records.length} records for ${period.code}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        period: period.code,
        records_imported: records.length,
        total_imports_eur: totalValue,
        batch_id: batchId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("CYSTAT ingestion error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
