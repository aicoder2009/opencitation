export const DID_YOU_KNOW_FACTS: string[] = [
  "The word 'bibliography' entered English around 1763, meaning the description of books.",
  "The Modern Language Association was founded in 1883 — MLA style itself came much later.",
  "APA's citation guidelines were first published in 1929 as a 7-page article in Psychological Bulletin.",
  "Kate Turabian's 'A Manual for Writers', basis for Chicago's student version, first appeared in 1937.",
  "BibTeX was created by Oren Patashnik in 1985 alongside LaTeX.",
  "The Digital Object Identifier (DOI) system was launched in 2000.",
  "CrossRef — the DOI registration agency for scholarly works — was founded in 2000.",
  "ISBNs were adopted internationally in 1970; the 13-digit format rolled out in 2007.",
  "arXiv started on Paul Ginsparg's NeXT workstation at Los Alamos in 1991.",
  "PubMed launched publicly in 1996, built on the MEDLINE index dating to 1971.",
  "The Harvard referencing style is often traced to Edward Laurens Mark's 1881 zoology paper — not to Harvard itself.",
  "The word 'citation' comes from the Latin 'citare', meaning 'to summon'.",
  "Zotero, whose name comes from the Albanian 'zotëroj' ('to master'), launched in 2006.",
  "The Citation Style Language (CSL) supports over 10,000 journal and publisher styles.",
  "The first Chicago Manual of Style was published in 1906, growing out of a one-sheet typesetter's guide.",
  "'et al.' is short for the Latin 'et alii' — 'and others'.",
  "The 'Vancouver style' used in medical journals dates to a 1978 meeting of editors in Vancouver, BC.",
  "The first academic journal, Philosophical Transactions of the Royal Society, began publishing in 1665.",
  "The practice of footnotes is often credited to historian Leopold von Ranke in the 1820s.",
  "A 'DOI' can be registered for anything from a paper to a dataset, a film, or even a tweet.",
];

export function pickFactoid(): string {
  return DID_YOU_KNOW_FACTS[
    Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length)
  ];
}
