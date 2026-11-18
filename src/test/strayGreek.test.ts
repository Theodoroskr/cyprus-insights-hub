import { describe, it, expect } from "vitest";
import { removeStrayGreek } from "../../supabase/functions/_shared/strayGreek";

const ENGLISH = "The Director General of the Research and Innovation Foundation participated in the Falling Walls Science Summit in Berlin.";

describe("removeStrayGreek (English stories with Greek website leftovers)", () => {
  it("drops a Greek note above the English article", () => {
    const body = "Είναι το μεγαλύτερο εργαλείο του Ιδρύματος από τη στιγμή που εκεί υποβάλλονται οι αιτήσεις.\n\n" + ENGLISH;
    const r = removeStrayGreek(body);
    expect(r.body).toBe(ENGLISH);
    expect(r.greekLeft).toBe(false);
  });

  it("drops language switchers and Greek contact addresses", () => {
    const body = `- [ΕΛΛΗΝΙΚΑ](https://x.cy/el "Αλλαγή σε ΕΛΛΗΝΙΚΑ")\n\n${ENGLISH}\n\n##### Στοιχεία Επικοινωνίας\n\nΟδός Μιχαήλ Καραολή\n\nT: +357 22602129`;
    const r = removeStrayGreek(body);
    expect(r.body).not.toMatch(/ΕΛΛΗΝΙΚΑ|Καραολή/);
    expect(r.body).toContain("Contact details");
    expect(r.body).toContain("+357 22602129");
  });

  it("flags Greek content in the middle of an English story for translation", () => {
    const body = `${ENGLISH}\n\nΗ Βουλή ενέκρινε σήμερα τον νέο προϋπολογισμό του κράτους.\n\n${ENGLISH}`;
    expect(removeStrayGreek(body).greekLeft).toBe(true);
  });
});
