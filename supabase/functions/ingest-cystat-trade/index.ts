import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Summary table: has monthly time series with EU/Non-EU split
const SUMMARY_API_URL =
  "https://cystatdb23px.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/8.CYSTAT-DB__External%20Trade";

// Detailed table: country-level breakdown (single latest month)
const DETAILED_API_URL =
  "https://cystatdb23px.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/8.CYSTAT-DB__External%20Trade__Foreign%20Trade%20Detailed%20Data__Imports";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Discover available months from the summary table metadata,
 * then return the index and period code for the target month.
 */
async function discoverMonths(): Promise<{
  monthMap: Map<string, string>; // periodCode -> index
  allMonths: string[];
}> {
  const resp = await fetch(SUMMARY_API_URL);
  if (!resp.ok) throw new Error(`Summary metadata fetch failed: ${resp.status}`);
  const meta = await resp.json();
  const monthVar = meta.variables?.find((v: any) => v.code === "MONTH");
  if (!monthVar) throw new Error("MONTH variable not found in summary table");

  const monthMap = new Map<string, string>();
  const allMonths: string[] = [];
  for (let i = 0; i < monthVar.values.length; i++) {
    monthMap.set(monthVar.valueTexts[i], monthVar.values[i]);
    allMonths.push(monthVar.valueTexts[i]);
  }
  return { monthMap, allMonths };
}

/**
 * Fetch summary data (total, EU, Non-EU imports in thousands EUR) for given month indices.
 */
async function fetchSummaryData(monthIndices: string[]) {
  const query = {
    query: [
      { code: "MONTH", selection: { filter: "item", values: monthIndices } },
      { code: "MEASURE", selection: { filter: "item", values: ["0"] } }, // Thousand euro
      { code: "REFERENCE PEIROD", selection: { filter: "item", values: ["0"] } }, // Monthly data
      { code: "TYPE OF GOODS", selection: { filter: "item", values: ["0"] } }, // Total goods
      { code: "PARTNER COUNTRY", selection: { filter: "all", values: ["*"] } }, // Total, Extra-EU, Intra-EU
      { code: "TYPE OF TRADE", selection: { filter: "item", values: ["0"] } }, // Imports
    ],
    response: { format: "json" },
  };

  const resp = await fetch(SUMMARY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Summary API error ${resp.status}: ${errText.slice(0, 300)}`);
  }
  return resp.json();
}

/**
 * Fetch country-level detailed import data (latest available month).
 */
async function fetchDetailedData() {
  // Discover available countries
  const metaResp = await fetch(DETAILED_API_URL);
  if (!metaResp.ok) {
    const t = await metaResp.text();
    throw new Error(`Detailed metadata error: ${metaResp.status} ${t.slice(0, 200)}`);
  }
  const meta = await metaResp.json();
  const countryVar = meta.variables?.find((v: any) => v.code === "PARTNER COUNTRY");

  const query = {
    query: [
      { code: "PRODUCT", selection: { filter: "top", values: ["1"] } }, // Total (first product = grand total)
      { code: "INDICATORS", selection: { filter: "item", values: ["0"] } }, // Value (€)
      { code: "PARTNER COUNTRY", selection: { filter: "all", values: ["*"] } },
    ],
    response: { format: "json" },
  };

  const resp = await fetch(DETAILED_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Detailed API error: ${resp.status} ${t.slice(0, 200)}`);
  }

  const result = await resp.json();
  // Enrich with country names from metadata
  const countryTexts = countryVar?.valueTexts || [];
  return { data: result, countryTexts };
}

function parsePeriod(code: string): { year: number; month: number } {
  const [y, m] = code.split("M");
  return { year: parseInt(y), month: parseInt(m) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Allow manual override: { months: 12 } to fetch last N months, or { period: "2026M01" }
    let requestedMonths = 6;
    let specificPeriod: string | null = null;
    try {
      const body = await req.json();
      if (body?.months) requestedMonths = body.months;
      if (body?.period) specificPeriod = body.period;
    } catch { /* no body */ }

    const batchId = `cystat-trade-${Date.now()}`;

    console.log("Discovering available months from CYSTAT...");
    const { monthMap, allMonths } = await discoverMonths();
    console.log(`Found ${allMonths.length} months, latest: ${allMonths[allMonths.length - 1]}`);

    // Determine which months to fetch
    let targetPeriods: string[];
    if (specificPeriod) {
      targetPeriods = [specificPeriod];
    } else {
      targetPeriods = allMonths.slice(-requestedMonths);
    }

    // Filter out months we already have
    const newPeriods: string[] = [];
    for (const p of targetPeriods) {
      const { year, month } = parsePeriod(p);
      const { data: existing } = await supabase
        .from("trade_monthly_totals")
        .select("id")
        .eq("year", year)
        .eq("month", month)
        .limit(1);

      if (!existing || existing.length === 0) {
        newPeriods.push(p);
      }
    }

    if (newPeriods.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `All requested periods already exist. Latest: ${targetPeriods[targetPeriods.length - 1]}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching ${newPeriods.length} new periods: ${newPeriods.join(", ")}`);

    // Log batch
    await supabase.from("data_import_batches").insert({
      batch_id: batchId,
      source_name: "CYSTAT PXWeb",
      source_url: SUMMARY_API_URL,
      import_type: "summary_import",
      status: "pending",
      records_received: 0,
      records_inserted: 0,
      records_updated: 0,
    });

    // Resolve month indices
    const monthIndices = newPeriods
      .map((p) => monthMap.get(p))
      .filter(Boolean) as string[];

    if (monthIndices.length === 0) {
      throw new Error("Could not resolve month indices for requested periods");
    }

    // Fetch summary data
    const summaryResult = await fetchSummaryData(monthIndices);
    const summaryRows = summaryResult.data || [];

    // Build month index-to-period lookup
    const indexToPeriod = new Map<string, string>();
    for (const [period, idx] of monthMap.entries()) {
      indexToPeriod.set(idx, period);
    }

    // Parse summary: group by month, partner country index
    // Partner: 0 = Total, 1 = Extra-EU, 2 = Intra-EU
    const monthlyData = new Map<string, { total: number; extraEu: number; intraEu: number }>();

    for (const row of summaryRows) {
      const monthIdx = row.key[0];
      const partnerIdx = row.key[4]; // PARTNER COUNTRY position
      const valueThousands = parseFloat(row.values[0]) || 0;
      const valueEur = valueThousands * 1000;

      const periodCode = indexToPeriod.get(monthIdx);
      if (!periodCode) continue;

      if (!monthlyData.has(periodCode)) {
        monthlyData.set(periodCode, { total: 0, extraEu: 0, intraEu: 0 });
      }

      const entry = monthlyData.get(periodCode)!;
      if (partnerIdx === "0") entry.total = valueEur;
      else if (partnerIdx === "1") entry.extraEu = valueEur;
      else if (partnerIdx === "2") entry.intraEu = valueEur;
    }

    console.log(`Parsed ${monthlyData.size} months of summary data`);

    // Insert monthly totals and KPI snapshots
    let totalRecords = 0;
    const sortedPeriods = [...monthlyData.keys()].sort();

    for (const periodCode of sortedPeriods) {
      const { year, month } = parsePeriod(periodCode);
      const dateMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const entry = monthlyData.get(periodCode)!;
      const periodLabel = `${MONTH_NAMES[month]} ${year}`;

      // Get previous month & year for growth calculations
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const { data: prevMonthData } = await supabase
        .from("trade_monthly_totals")
        .select("total_imports_eur")
        .eq("year", prevYear)
        .eq("month", prevMonth)
        .maybeSingle();

      const { data: prevYearData } = await supabase
        .from("trade_monthly_totals")
        .select("total_imports_eur")
        .eq("year", year - 1)
        .eq("month", month)
        .maybeSingle();

      const momGrowth = prevMonthData?.total_imports_eur
        ? Math.round(((entry.total - prevMonthData.total_imports_eur) / prevMonthData.total_imports_eur) * 10000) / 100
        : null;

      const yoyGrowth = prevYearData?.total_imports_eur
        ? Math.round(((entry.total - prevYearData.total_imports_eur) / prevYearData.total_imports_eur) * 10000) / 100
        : null;

      const euSharePct = entry.total > 0 ? Math.round((entry.intraEu / entry.total) * 10000) / 100 : 0;
      const nonEuSharePct = entry.total > 0 ? Math.round((entry.extraEu / entry.total) * 10000) / 100 : 0;

      // Insert raw record
      await supabase.from("raw_trade_imports").insert({
        source_dataset_code: "CYSTAT_SUMMARY",
        source_dataset_name: "Foreign Trade Summary Data, Monthly",
        year,
        month,
        period_label: periodLabel,
        country_name: "Cyprus Total",
        import_value_eur: entry.total,
        source_url: SUMMARY_API_URL,
        batch_id: batchId,
      });

      // Insert monthly total
      await supabase.from("trade_monthly_totals").insert({
        year,
        month,
        date_month: dateMonth,
        total_imports_eur: entry.total,
        mom_growth_pct: momGrowth,
        yoy_growth_pct: yoyGrowth,
      });

      // Insert KPI snapshot
      await supabase.from("trade_kpi_snapshots").insert({
        date_month: dateMonth,
        total_imports_eur: entry.total,
        mom_growth_pct: momGrowth,
        yoy_growth_pct: yoyGrowth,
        eu_share_pct: euSharePct,
        non_eu_share_pct: nonEuSharePct,
      });

      totalRecords++;
    }

    // Now fetch detailed country-level data for the latest month
    try {
      console.log("Fetching detailed country-level data...");
      const { data: detailedResult, countryTexts } = await fetchDetailedData();
      const detailedRows = detailedResult.data || [];

      // Get title to determine which month this is for
      const detailedTitle = detailedResult.metadata?.[0]?.label || "";
      console.log(`Detailed data: ${detailedTitle}, ${detailedRows.length} rows`);

      // Load trade_countries for matching
      const { data: tradeCountries } = await supabase
        .from("trade_countries")
        .select("id, country_name, country_code, eu_member");

      const countryByCode = new Map(
        (tradeCountries || []).map((c) => [c.country_code?.toUpperCase(), c])
      );
      const countryByName = new Map(
        (tradeCountries || []).map((c) => [c.country_name.toLowerCase(), c])
      );

      // Parse country data
      const countryRecords: Array<{
        name: string;
        code: string;
        value: number;
        matched_id: string | null;
        eu_member: boolean;
      }> = [];

      for (const row of detailedRows) {
        const countryIdx = parseInt(row.key[2] || "0");
        const value = parseFloat(row.values[0]) || 0;
        if (value <= 0 || countryIdx === 0) continue; // Skip total and zero values

        const countryText = countryTexts[countryIdx] || "Unknown";
        // Country text format: "GR Greece" or "AE United Arab Emirates"
        const codeMatch = countryText.match(/^([A-Z]{2})\s+(.+)$/);
        const code = codeMatch?.[1] || "";
        const name = codeMatch?.[2] || countryText;

        const matched = countryByCode.get(code) || countryByName.get(name.toLowerCase());

        countryRecords.push({
          name,
          code,
          value,
          matched_id: matched?.id || null,
          eu_member: matched?.eu_member || false,
        });
      }

      // Sort by value descending
      countryRecords.sort((a, b) => b.value - a.value);
      const totalValue = countryRecords.reduce((s, r) => s + r.value, 0);

      // Use the latest period from our summary data for the date_month
      const latestPeriod = sortedPeriods[sortedPeriods.length - 1] || allMonths[allMonths.length - 1];
      const { year: cYear, month: cMonth } = parsePeriod(latestPeriod);
      const cDateMonth = `${cYear}-${String(cMonth).padStart(2, "0")}-01`;

      // Insert country monthly records
      const countryMonthlyRows = countryRecords.map((r, i) => ({
        year: cYear,
        month: cMonth,
        date_month: cDateMonth,
        country_id: r.matched_id,
        total_imports_eur: r.value,
        country_share_pct: totalValue > 0
          ? Math.round((r.value / totalValue) * 10000) / 100
          : 0,
        rank_position: i + 1,
      }));

      // Insert in batches of 50
      for (let i = 0; i < countryMonthlyRows.length; i += 50) {
        await supabase.from("trade_country_monthly").insert(countryMonthlyRows.slice(i, i + 50));
      }

      console.log(`Inserted ${countryRecords.length} country records`);

      // Update the latest KPI snapshot with country details
      const top5Value = countryRecords.slice(0, 5).reduce((s, r) => s + r.value, 0);
      const topCountry = countryRecords[0];

      await supabase
        .from("trade_kpi_snapshots")
        .update({
          top_import_country_id: topCountry?.matched_id || null,
          top_import_country_value_eur: topCountry?.value || 0,
          top_5_countries_share_pct: totalValue > 0
            ? Math.round((top5Value / totalValue) * 10000) / 100
            : 0,
        })
        .eq("date_month", cDateMonth);

    } catch (detailErr) {
      console.warn("Detailed country data fetch failed (non-fatal):", detailErr);
    }

    // Update batch status
    await supabase
      .from("data_import_batches")
      .update({
        status: "success",
        records_received: totalRecords,
        records_inserted: totalRecords,
        finished_at: new Date().toISOString(),
      })
      .eq("batch_id", batchId);

    console.log(`Successfully imported ${totalRecords} monthly periods`);

    return new Response(
      JSON.stringify({
        success: true,
        periods_imported: totalRecords,
        periods: [...monthlyData.keys()].sort(),
        batch_id: batchId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("CYSTAT ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
