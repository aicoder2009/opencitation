import { describe, it, expect } from "vitest";
import { toRIS, toRISMultiple } from "./ris";
import type { CitationFields } from "@/types";

const baseJournal = (overrides: Partial<CitationFields> = {}): CitationFields =>
  ({
    sourceType: "journal",
    accessType: "database",
    title: "On the Origin of Species",
    journalTitle: "Nature",
    authors: [{ firstName: "Charles", lastName: "Darwin" }],
    publicationDate: { year: 2024, month: 5, day: 10 },
    volume: "12",
    issue: "3",
    pageRange: "100-110",
    doi: "10.1000/xyz",
    url: "https://example.com",
    publisher: "Nature Publishing Group",
    publicationPlace: "London",
    language: "en",
    ...overrides,
  } as CitationFields);

describe("toRIS", () => {
  it("emits TY, AU, TI, PY for a basic citation", () => {
    const ris = toRIS(baseJournal());
    expect(ris).toContain("TY  - JOUR");
    expect(ris).toContain("AU  - Darwin, Charles");
    expect(ris).toContain("TI  - On the Origin of Species");
    expect(ris).toContain("PY  - 2024/05/10");
  });

  it("always emits base publisher and place when set", () => {
    const ris = toRIS(baseJournal());
    expect(ris).toContain("PB  - Nature Publishing Group");
    expect(ris).toContain("CY  - London");
  });

  it("emits journal volume, issue, and split page range", () => {
    const ris = toRIS(baseJournal());
    expect(ris).toContain("VL  - 12");
    expect(ris).toContain("IS  - 3");
    expect(ris).toContain("SP  - 100");
    expect(ris).toContain("EP  - 110");
  });

  it("emits T2 from journal title and JO alias", () => {
    const ris = toRIS(baseJournal());
    expect(ris).toContain("JO  - Nature");
    expect(ris).toContain("T2  - Nature");
  });

  it("emits translators as A4", () => {
    const ris = toRIS(
      baseJournal({
        translators: [{ firstName: "Edith", lastName: "Grossman" }],
      })
    );
    expect(ris).toContain("A4  - Grossman, Edith");
  });

  it("emits originalPublicationDate as OP", () => {
    const ris = toRIS(
      baseJournal({ originalPublicationDate: { year: 1859 } })
    );
    expect(ris).toContain("OP  - 1859//");
  });

  it("handles year-only access date", () => {
    const ris = toRIS(baseJournal({ accessDate: { year: 2026 } }));
    expect(ris).toContain("Y2  - 2026//");
  });

  it("emits per-citation tags as KW lines", () => {
    const ris = toRIS(baseJournal(), { tags: ["evolution", "biology"] });
    expect(ris).toContain("KW  - evolution");
    expect(ris).toContain("KW  - biology");
  });

  it("emits notes as a single N1 line with newlines escaped", () => {
    const ris = toRIS(baseJournal(), {
      notes: "Important source.\nDarwin defines natural selection here.",
    });
    expect(ris).toContain(
      "N1  - Important source. \\n Darwin defines natural selection here."
    );
  });

  it("emits each quote as its own N1 with optional page", () => {
    const ris = toRIS(baseJournal(), {
      quotes: [
        { text: "All life is connected.", page: "p. 42" },
        { text: "Survival of the fittest.", page: undefined },
      ],
    });
    expect(ris).toContain('N1  - "All life is connected." (p. 42)');
    expect(ris).toContain('N1  - "Survival of the fittest."');
  });

  it("emits book volume, series, isbn, and pages", () => {
    const ris = toRIS({
      sourceType: "book",
      accessType: "print",
      title: "The Lord of the Rings",
      authors: [{ firstName: "J. R. R.", lastName: "Tolkien" }],
      publicationDate: { year: 1954 },
      isbn: "0-04-823086-7",
      edition: "1st",
      volume: "2",
      series: "The Lord of the Rings",
      pageRange: "1-352",
    } as CitationFields);
    expect(ris).toContain("SN  - 0-04-823086-7");
    expect(ris).toContain("ET  - 1st");
    expect(ris).toContain("VL  - 2");
    expect(ris).toContain("T3  - The Lord of the Rings");
    expect(ris).toContain("SP  - 1");
    expect(ris).toContain("EP  - 352");
  });

  it("emits podcast season and episode numbers", () => {
    const ris = toRIS({
      sourceType: "podcast-episode",
      accessType: "web",
      title: "Episode 100: Whales",
      showName: "Ologies",
      host: [{ firstName: "Alie", lastName: "Ward" }],
      seasonNumber: "5",
      episodeNumber: "100",
      duration: "01:23:45",
      publicationDate: { year: 2024 },
    } as CitationFields);
    expect(ris).toContain("T2  - Ologies");
    expect(ris).toContain("A2  - Ward, Alie");
    expect(ris).toContain("VL  - 5");
    expect(ris).toContain("IS  - 100");
    expect(ris).toContain("RP  - 01:23:45");
  });

  it("ER closes every record", () => {
    const ris = toRIS(baseJournal());
    expect(ris.trim().endsWith("ER  -")).toBe(true);
  });
});

describe("toRISMultiple", () => {
  it("accepts a plain CitationFields list (legacy)", () => {
    const out = toRISMultiple([baseJournal(), baseJournal({ title: "Two" })]);
    expect(out).toContain("TI  - On the Origin of Species");
    expect(out).toContain("TI  - Two");
  });

  it("accepts RISItem objects with extras", () => {
    const out = toRISMultiple([
      { fields: baseJournal(), tags: ["primary"], notes: "key paper" },
    ]);
    expect(out).toContain("KW  - primary");
    expect(out).toContain("N1  - key paper");
  });
});
