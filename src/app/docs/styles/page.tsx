import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Citation Styles — OpenCitation Docs" };

const styles = [
  {
    id: "apa",
    name: "APA 7th Edition",
    org: "American Psychological Association",
    usedIn: "Psychology, education, social sciences",
    bookExample: 'Author, A. A. (Year). *Title of work: Capital letter also for subtitle*. Publisher.',
    articleExample: 'Author, A. A., & Author, B. B. (Year). Title of article. *Journal Name*, *volume*(issue), page–page. https://doi.org/xxxxx',
    inText: "(Author, Year) or Author (Year)",
  },
  {
    id: "mla",
    name: "MLA 9th Edition",
    org: "Modern Language Association",
    usedIn: "Literature, humanities, arts",
    bookExample: 'Author Last, First. *Title of Work*. Publisher, Year.',
    articleExample: 'Author Last, First. "Title of Article." *Journal Name*, vol. X, no. X, Year, pp. X–X.',
    inText: "(Author Page) — e.g., (Smith 42)",
  },
  {
    id: "chicago",
    name: "Chicago 17th Edition",
    org: "University of Chicago Press",
    usedIn: "History, fine arts, humanities",
    bookExample: 'Author Last, First. *Title of Work*. Place: Publisher, Year.',
    articleExample: 'Author Last, First. "Title of Article." *Journal Name* Volume, no. Issue (Year): Page–Page.',
    inText: "Footnote / endnote superscript, or (Author Year) in author-date variant",
  },
  {
    id: "harvard",
    name: "Harvard",
    org: "No single governing body — varies by institution",
    usedIn: "Sciences, social sciences, UK/Australia universities",
    bookExample: 'Author, A.A. (Year) *Title of work*. Place of publication: Publisher.',
    articleExample: 'Author, A.A. and Author, B.B. (Year) \'Title of article\', *Journal Name*, Volume(Issue), pp. Page–Page.',
    inText: "(Author, Year) — e.g., (Smith, 2020)",
  },
];

export default function Styles() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Citation Styles" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Citation Styles</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        OpenCitation supports four styles. Use the style selector on the citation page to switch at any time — the formatted output updates instantly.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-4">Choosing a style</h2>
      <p className="text-sm mb-3 leading-relaxed">
        If your instructor or publisher specified a style, use that. If not, a rough guide: APA for psychology and social sciences; MLA for literature and humanities; Chicago for history; Harvard for sciences and UK/Australian institutions.
      </p>
      <p className="text-sm mb-3 leading-relaxed">
        Citations saved to a List are stored with all their raw field data — you can change the style at any time and the citation will be re-formatted correctly.
      </p>

      {styles.map((s) => (
        <div key={s.id} id={s.id} className="mt-8">
          <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3">{s.name}</h2>
          <table className="w-full border-collapse text-sm mb-3">
            <tbody>
              <tr>
                <td className="border border-wiki-border px-3 py-1 font-medium bg-wiki-offwhite w-32">Organization</td>
                <td className="border border-wiki-border px-3 py-1">{s.org}</td>
              </tr>
              <tr>
                <td className="border border-wiki-border px-3 py-1 font-medium bg-wiki-offwhite">Common in</td>
                <td className="border border-wiki-border px-3 py-1">{s.usedIn}</td>
              </tr>
              <tr>
                <td className="border border-wiki-border px-3 py-1 font-medium bg-wiki-offwhite">In-text</td>
                <td className="border border-wiki-border px-3 py-1 font-mono text-xs">{s.inText}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-base font-bold mt-3 mb-1">Book example</h3>
          <div className="border border-wiki-border-light bg-wiki-offwhite px-3 py-2 text-sm font-mono mb-3 text-wiki-text-muted">
            {s.bookExample}
          </div>

          <h3 className="text-base font-bold mt-3 mb-1">Journal article example</h3>
          <div className="border border-wiki-border-light bg-wiki-offwhite px-3 py-2 text-sm font-mono mb-1 text-wiki-text-muted">
            {s.articleExample}
          </div>
        </div>
      ))}

      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/citations" className="text-wiki-link hover:underline">
          ← Generating Citations
        </Link>
        <Link href="/docs/source-types" className="text-wiki-link hover:underline">
          Next: Source Types →
        </Link>
      </div>
    </div>
  );
}
