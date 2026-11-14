// Companies that get their own search-engine page (and sitemap entry): firms with a regulator
// licence or professional membership, curated profiles, and firms linked from approved news.
// The rest of the registry stays reachable on the site but out of the sitemap until pages
// can be served with their own head on request.
import { INDEXABLE_COMPANY_FILTER } from "../src/lib/pageHeads";

export interface IndexableCompany { id: string; slug: string; company_name: string; city: string | null; activity_description: string | null; registration_no: string | null }
type FetchAll = <T>(table: string, query: string) => Promise<T[]>;
const COLS = "id,slug,company_name,city,activity_description,registration_no";

export async function indexableCompanies(fetchAll: FetchAll): Promise<IndexableCompany[]> {
  const [flagged, curated, linked] = await Promise.all([
    fetchAll<IndexableCompany>("directory_companies", `select=${COLS}&slug=not.is.null&${INDEXABLE_COMPANY_FILTER}&order=id.asc`),
    fetchAll<{ directory_company_id: string | null }>("companies", "select=directory_company_id&directory_company_id=not.is.null").catch(() => []),
    fetchAll<{ entity_id: string }>("news_entity_links", "select=entity_id&entity_type=eq.company&status=eq.approved").catch(() => []),
  ]);
  const have = new Set(flagged.map((c) => c.id));
  const extra = [...new Set([...curated.map((c) => c.directory_company_id!), ...linked.map((l) => l.entity_id)])].filter((id) => id && !have.has(id));
  const more: IndexableCompany[] = [];
  for (let i = 0; i < extra.length; i += 150) {
    more.push(...await fetchAll<IndexableCompany>("directory_companies", `select=${COLS}&slug=not.is.null&id=in.(${extra.slice(i, i + 150).join(",")})`));
  }
  return [...flagged, ...more];
}
