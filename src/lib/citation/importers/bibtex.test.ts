import { describe, expect, it } from "vitest";
import { parseBibTeX, parseAllBibTeX } from "./bibtex";

describe("parseBibTeX", () => {
  it("parses the user-supplied inproceedings entry", () => {
    const input = `@inproceedings{boumber-etal-2024-domain,
title = "Domain-Agnostic Adapter Architecture for Deception Detection: Extensive Evaluations with the {DIF}rau{D} Benchmark",
author = "Boumber, Dainis A.  and Qachfar, Fatima Zahra  and Verma, Rakesh",
editor = "Calzolari, Nicoletta  and Kan, Min-Yen  and Hoste, Veronique  and Lenci, Alessandro  and Sakti, Sakriani  and Xue, Nianwen",
booktitle = "Proceedings of the 2024 Joint International Conference on Computational Linguistics, Language Resources and Evaluation (LREC-COLING 2024)",
month = may,
year = "2024",
address = "Torino, Italia",
publisher = "ELRA and ICCL",
url = "https://aclanthology.org/2024.lrec-main.468",
pages = "5260--5274"}`;

    const result = parseBibTeX(input);
    expect(result).not.toBeNull();
    expect(result!.entryType).toBe("inproceedings");
    expect(result!.entryKey).toBe("boumber-etal-2024-domain");

    const f = result!.fields;
    expect(f.sourceType).toBe("conference-paper");
    expect(f.title).toBe(
      "Domain-Agnostic Adapter Architecture for Deception Detection: Extensive Evaluations with the DIFrauD Benchmark"
    );

    expect(f.authors).toHaveLength(3);
    expect(f.authors![0]).toEqual({
      lastName: "Boumber",
      firstName: "Dainis",
      middleName: "A.",
    });
    expect(f.authors![1]).toEqual({
      lastName: "Qachfar",
      firstName: "Fatima",
      middleName: "Zahra",
    });
    expect(f.authors![2]).toEqual({
      lastName: "Verma",
      firstName: "Rakesh",
      middleName: undefined,
    });

    expect(f.editors).toHaveLength(6);
    expect(f.editors![0]).toEqual({
      lastName: "Calzolari",
      firstName: "Nicoletta",
      middleName: undefined,
    });

    expect(f.publicationDate).toEqual({ year: 2024, month: 5, day: undefined });
    expect(f.publisher).toBe("ELRA and ICCL");
    expect(f.url).toBe("https://aclanthology.org/2024.lrec-main.468");
    expect(f.publicationPlace).toBe("Torino, Italia");

    if (f.sourceType === "conference-paper") {
      expect(f.conferenceLocation).toBe("Torino, Italia");
      expect(f.proceedingsTitle).toContain("LREC-COLING 2024");
      expect(f.pageRange).toBe("5260-5274");
    }
  });

  it("maps @article to journal source type", () => {
    const input = `@article{doe2020,
      author = {Doe, John},
      title = {Sample Article},
      journal = {Nature},
      year = {2020},
      volume = {10},
      number = {3},
      pages = {1--15}
    }`;

    const result = parseBibTeX(input);
    expect(result).not.toBeNull();
    const f = result!.fields;
    expect(f.sourceType).toBe("journal");
    if (f.sourceType === "journal") {
      expect(f.journalTitle).toBe("Nature");
      expect(f.volume).toBe("10");
      expect(f.issue).toBe("3");
      expect(f.pageRange).toBe("1-15");
    }
  });

  it("handles First Middle Last name format", () => {
    const input = `@article{x,
      author = {John Q. Public and Jane Doe},
      title = {X},
      journal = {J},
      year = {2024}
    }`;
    const result = parseBibTeX(input);
    expect(result!.fields.authors).toEqual([
      { lastName: "Public", firstName: "John", middleName: "Q." },
      { lastName: "Doe", firstName: "Jane", middleName: undefined },
    ]);
  });

  it("returns null for invalid input", () => {
    expect(parseBibTeX("not a bibtex entry")).toBeNull();
    expect(parseBibTeX("")).toBeNull();
  });

  it("maps @book to book source type with isbn", () => {
    const input = `@book{k, author = {Smith, Jane}, title = {Title}, year = {2020}, publisher = {Acme}, isbn = {978-0-00-000000-0}}`;
    const result = parseBibTeX(input);
    expect(result!.fields.sourceType).toBe("book");
    if (result!.fields.sourceType === "book") {
      expect(result!.fields.isbn).toBe("978-0-00-000000-0");
    }
  });

  it("handles numeric month", () => {
    const input = `@misc{k, title = {X}, year = {2024}, month = {6}}`;
    const result = parseBibTeX(input);
    expect(result!.fields.publicationDate?.month).toBe(6);
  });
});

describe("parseAllBibTeX", () => {
  it("parses two entries from a .bib file", () => {
    const input = `
@article{smith2024,
  title = {First Article},
  author = {Smith, Jane},
  journal = {Test Journal},
  year = {2024}
}

@book{jones2023,
  title = {A Book},
  author = {Jones, Bob},
  publisher = {Test Press},
  year = {2023}
}
`;
    const results = parseAllBibTeX(input);
    expect(results).toHaveLength(2);
    expect(results[0].entryKey).toBe("smith2024");
    expect(results[0].fields.sourceType).toBe("journal");
    expect(results[1].entryKey).toBe("jones2023");
    expect(results[1].fields.sourceType).toBe("book");
  });

  it("skips @string, @preamble, and @comment directives", () => {
    const input = `
@string{pub = "Test Press"}
@preamble{"Some preamble text"}
@comment{This is a comment}
@article{real2024,
  title = {Real Entry},
  author = {Author, Real},
  journal = {Journal},
  year = {2024}
}
`;
    const results = parseAllBibTeX(input);
    expect(results).toHaveLength(1);
    expect(results[0].entryKey).toBe("real2024");
  });

  it("deduplicates entries with the same key", () => {
    const input = `
@article{dup,
  title = {First},
  author = {A, B},
  journal = {J},
  year = {2024}
}
@article{dup,
  title = {Second},
  author = {C, D},
  journal = {J},
  year = {2024}
}
`;
    const results = parseAllBibTeX(input);
    expect(results).toHaveLength(1);
    expect(results[0].fields.title).toBe("First");
  });

  it("returns empty array for empty input", () => {
    expect(parseAllBibTeX("")).toHaveLength(0);
    expect(parseAllBibTeX("   \n  ")).toHaveLength(0);
  });

  it("returns empty array for invalid BibTeX", () => {
    expect(parseAllBibTeX("not bibtex at all")).toHaveLength(0);
  });
});
