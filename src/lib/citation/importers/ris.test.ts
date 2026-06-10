import { describe, it, expect } from "vitest";
import { parseAllRIS, looksLikeRIS } from "./ris";
import { toRIS } from "../exporters/ris";
import type { JournalFields } from "@/types";

const JOURNAL_RECORD = `TY  - JOUR
AU  - Smith, Jane A.
AU  - Doe, John
TI  - On the Citation of Things
T2  - Journal of Examples
PY  - 2023/05/14/
VL  - 12
IS  - 3
SP  - 45
EP  - 67
SN  - 1234-5678
DO  - 10.1000/xyz123
UR  - https://example.com/article
AB  - A study of citations.
ER  - `;

describe("parseAllRIS", () => {
  it("parses a journal record", () => {
    const results = parseAllRIS(JOURNAL_RECORD);
    expect(results).toHaveLength(1);

    const { fields, entryType, entryKey } = results[0];
    expect(entryType).toBe("JOUR");
    expect(entryKey).toBe("smith2023");
    expect(fields.sourceType).toBe("journal");
    expect(fields.title).toBe("On the Citation of Things");
    expect(fields.authors).toEqual([
      { lastName: "Smith", firstName: "Jane", middleName: "A." },
      { lastName: "Doe", firstName: "John", middleName: undefined },
    ]);
    expect(fields.publicationDate).toEqual({ year: 2023, month: 5, day: 14 });
    expect(fields.url).toBe("https://example.com/article");
    expect(fields.doi).toBe("10.1000/xyz123");
    expect(fields.annotation).toBe("A study of citations.");
    expect(fields.accessType).toBe("web");

    const journal = fields as JournalFields;
    expect(journal.journalTitle).toBe("Journal of Examples");
    expect(journal.volume).toBe("12");
    expect(journal.issue).toBe("3");
    expect(journal.pageRange).toBe("45-67");
    expect(journal.issn).toBe("1234-5678");
  });

  it("parses a book record with ISBN and edition", () => {
    const results = parseAllRIS(`TY  - BOOK
AU  - Turabian, Kate L.
TI  - A Manual for Writers
ET  - 9
PB  - University of Chicago Press
CY  - Chicago
PY  - 2018
SN  - 978-0-226-43057-7
ER  - `);
    expect(results).toHaveLength(1);
    const { fields } = results[0];
    expect(fields.sourceType).toBe("book");
    expect(fields.publisher).toBe("University of Chicago Press");
    expect(fields.publicationPlace).toBe("Chicago");
    expect(fields.publicationDate).toEqual({ year: 2018, month: undefined, day: undefined });
    expect(fields.accessType).toBe("print");
    expect("isbn" in fields && fields.isbn).toBe("978-0-226-43057-7");
    expect("edition" in fields && fields.edition).toBe("9");
  });

  it("parses a book chapter with editors and pages", () => {
    const results = parseAllRIS(`TY  - CHAP
AU  - Author, Amy
ED  - Editor, Ed
TI  - Chapter Title
T2  - The Big Book
SP  - 100
EP  - 120
PY  - 2020
ER  - `);
    const { fields } = results[0];
    expect(fields.sourceType).toBe("book-chapter");
    expect("bookTitle" in fields && fields.bookTitle).toBe("The Big Book");
    expect("pageRange" in fields && fields.pageRange).toBe("100-120");
    expect(fields.editors).toEqual([
      { lastName: "Editor", firstName: "Ed", middleName: undefined },
    ]);
  });

  it("parses multiple records", () => {
    const results = parseAllRIS(`${JOURNAL_RECORD}\n\nTY  - ELEC\nTI  - Some Web Page\nT2  - Example Site\nUR  - https://example.org\nER  - `);
    expect(results).toHaveLength(2);
    expect(results[1].fields.sourceType).toBe("website");
    expect("siteName" in results[1].fields && results[1].fields.siteName).toBe("Example Site");
    expect(results[1].entryKey).toBe("entry-2");
  });

  it("treats single-token and uncommaed multi-word names sensibly", () => {
    const results = parseAllRIS(`TY  - RPRT
AU  - World Health Organization
TI  - Report Title
ER  - `);
    expect(results[0].fields.authors).toEqual([
      { lastName: "World Health Organization", isOrganization: true },
    ]);
  });

  it("joins wrapped continuation lines into the previous value", () => {
    const results = parseAllRIS(`TY  - JOUR
TI  - A Very Long Title That
Wraps Onto The Next Line
T2  - Journal
ER  - `);
    expect(results[0].fields.title).toBe("A Very Long Title That Wraps Onto The Next Line");
  });

  it("ignores unknown tags and missing ER on the final record", () => {
    const results = parseAllRIS(`TY  - JOUR\nTI  - No Terminator\nXX  - mystery\nZ9  - whatever`);
    expect(results).toHaveLength(1);
    expect(results[0].fields.title).toBe("No Terminator");
  });

  it("returns an empty array for non-RIS input", () => {
    expect(parseAllRIS("@article{key, title={x}}")).toEqual([]);
    expect(parseAllRIS("")).toEqual([]);
  });

  it("maps preprint, thesis, and dataset types", () => {
    const results = parseAllRIS(`TY  - UNPD
TI  - Preprint
M1  - 2301.00001
PB  - arXiv
ER  -
TY  - THES
TI  - Dissertation
PB  - Example University
M3  - PhD thesis
ER  -
TY  - DATA
TI  - The Data
ET  - 2.0
ER  - `);
    expect(results.map((r) => r.fields.sourceType)).toEqual(["preprint", "thesis", "dataset"]);
    expect("preprintId" in results[0].fields && results[0].fields.preprintId).toBe("2301.00001");
    expect("institution" in results[1].fields && results[1].fields.institution).toBe("Example University");
    expect("degree" in results[1].fields && results[1].fields.degree).toBe("doctoral");
    expect("version" in results[2].fields && results[2].fields.version).toBe("2.0");
  });

  it("round-trips a journal citation through the RIS exporter", () => {
    const original = parseAllRIS(JOURNAL_RECORD)[0].fields;
    const reparsed = parseAllRIS(toRIS(original))[0].fields;
    expect(reparsed).toEqual(original);
  });
});

describe("looksLikeRIS", () => {
  it("detects RIS input", () => {
    expect(looksLikeRIS(JOURNAL_RECORD)).toBe(true);
    expect(looksLikeRIS("TY - JOUR\nER - ")).toBe(true);
  });

  it("rejects BibTeX input", () => {
    expect(looksLikeRIS("@article{smith2024,\n title={X}\n}")).toBe(false);
    expect(looksLikeRIS("")).toBe(false);
  });
});
