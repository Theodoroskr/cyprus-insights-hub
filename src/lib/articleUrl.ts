// Story web addresses carry the headline after the id: /article/<id>/<headline-slug>.
// The id alone still opens the story (and is then rewritten to the full address).
export function headlineSlug(title: string | null | undefined): string {
  return (title ?? "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 80).replace(/-+[^-]*$/, (m) => (m.length > 1 && (title ?? "").length > 80 ? "" : m))
    .replace(/-+$/g, "");
}

export function articlePath(id: string, title?: string | null): string {
  const slug = headlineSlug(title);
  return slug ? `/article/${id}/${slug}` : `/article/${id}`;
}
