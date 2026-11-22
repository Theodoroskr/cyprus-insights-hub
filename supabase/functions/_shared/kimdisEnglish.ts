// Pure check shared by the KIMDIS translator and its tests.
const GREEK_RUN = /[\u0370-\u03FF\u1F00-\u1FFF]{3,}/;
/**
 * True when a translation reads in English. Greek reference codes copied from the source are allowed
 * (Diavgeia ΑΔΑ codes such as "Ρ1ΦΝ46ΜΑΖΤ-ΨΜΞ", or short capital acronyms such as "ΕΟΤ"), because they must stay exact.
 */
export function readsInEnglish(en: string, source: string): boolean {
  const kept = new Set(source.split(/[\s,;:()«»"'’΄]+/).filter((t) => /\d/.test(t) || /^[\u0386-\u03AB.\-–]{2,10}$/.test(t)));
  const rest = en.split(/[\s,;:()«»"'’΄]+/).filter((t) => !kept.has(t)).join(" ");
  return !GREEK_RUN.test(rest);
}
