import { describe, expect, it } from "vitest";
import { parseBibTeX } from "./bibtex";

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
