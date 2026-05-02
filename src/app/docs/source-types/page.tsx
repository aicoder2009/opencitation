import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_DESCRIPTIONS } from "@/types/source-types";

export const metadata = { title: "Source Types — OpenCitation Docs" };

const groups: { heading: string; types: string[] }[] = [
  {
    heading: "Print & Long-form",
    types: ["book", "book-chapter", "journal", "newspaper", "encyclopedia", "thesis", "conference-paper", "government-report"],
  },
  {
    heading: "Web & Digital",
    types: ["website", "blog", "social-media", "ai-generated", "dataset", "software", "preprint"],
  },
  {
    heading: "Audiovisual",
    types: ["video", "film", "tv-series", "tv-episode", "song", "album", "podcast-episode", "video-game"],
  },
  {
    heading: "Visual & Archival",
    types: ["image", "artwork"],
  },
  {
    heading: "Other",
    types: ["interview", "legal-case", "miscellaneous"],
  },
];

export default function SourceTypes() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Source Types" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Source Types</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        27 source types. Each type shows only the fields relevant to it — no blank, confusing boxes.
      </p>

      <div className="border border-wiki-border-light bg-wiki-offwhite p-3 text-sm mb-6">
        Select the source type <em>before</em> filling in fields or using Quick Add. The formatter uses the type to determine which fields are required and how to punctuate them.
      </div>

      {groups.map((group) => (
        <div key={group.heading}>
          <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-0 mt-8">{group.heading}</h2>
          <table className="w-full border-collapse text-sm mb-2">
            <thead>
              <tr className="bg-wiki-tab-bg">
                <th className="border border-wiki-border px-3 py-1 text-left font-medium">Type</th>
                <th className="border border-wiki-border px-3 py-1 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {group.types.map((type, i) => {
                const key = type as keyof typeof SOURCE_TYPE_LABELS;
                return (
                  <tr key={type} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
                    <td className="border border-wiki-border px-3 py-1 font-medium whitespace-nowrap">
                      {SOURCE_TYPE_LABELS[key]}
                    </td>
                    <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">
                      {SOURCE_TYPE_DESCRIPTIONS[key]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Notes on specific types</h2>

      <h3 className="text-base font-bold mt-4 mb-1">AI-Generated Content</h3>
      <p className="text-sm mb-3 leading-relaxed">
        For citing outputs from ChatGPT, Claude, Gemini, and similar tools. Include the model name, version, the prompt used, and the date of the response. Different style guides are still standardizing this format.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Preprint</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Covers arXiv, bioRxiv, medRxiv, SSRN, and similar pre-peer-review repositories. Use the arXiv Quick Add to auto-fill preprint metadata.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Legal Case</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Provides a simple citation format. For full Bluebook or OSCOLA legal citation, consult your institution&apos;s style guide — those formats are more complex than a general citation tool can reliably automate.
      </p>

      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/styles" className="text-wiki-link hover:underline">
          ← Citation Styles
        </Link>
        <Link href="/docs/organize" className="text-wiki-link hover:underline">
          Next: Lists & Projects →
        </Link>
      </div>
    </div>
  );
}
