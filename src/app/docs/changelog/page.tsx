import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getGitHubReleases, getGitHubCommits } from "@/lib/github";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export const metadata = { title: "Changelog — OpenCitation" };

export const revalidate = 3600;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// First line of a commit message, stripped of conventional-commit prefix noise
function commitTitle(message: string) {
  const first = message.split("\n")[0].trim();
  // Strip "type(scope): " prefix so the table stays readable
  return first.replace(/^[a-z]+(\([^)]+\))?:\s*/i, "");
}

export default async function ChangelogPage() {
  const [releases, commits] = await Promise.all([
    getGitHubReleases(),
    getGitHubCommits(40),
  ]);

  const hasReleases = releases.length > 0;

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Changelog" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Changelog</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        {hasReleases ? (
          <>
            Release history pulled from{" "}
            <a
              href={`https://github.com/aicoder2009/opencitation/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wiki-link hover:underline"
            >
              GitHub Releases
            </a>
            .
          </>
        ) : (
          <>
            Recent commits from{" "}
            <a
              href={`https://github.com/aicoder2009/opencitation/commits/main`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wiki-link hover:underline"
            >
              GitHub
            </a>
            . Full tagged releases coming soon.
          </>
        )}
      </p>

      {hasReleases ? (
        <div className="space-y-0">
          {releases.map((release) => (
            <div key={release.id} className="border border-wiki-border-light mb-6">
              <div className="flex items-baseline justify-between px-4 py-3 bg-wiki-tab-bg border-b border-wiki-border-light">
                <div className="flex items-baseline gap-3">
                  <a
                    href={release.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-bold text-wiki-link hover:underline"
                  >
                    {release.name || release.tag_name}
                  </a>
                  {release.prerelease && (
                    <span className="text-xs border border-wiki-border-light px-1.5 py-0.5 text-wiki-text-muted">
                      pre-release
                    </span>
                  )}
                </div>
                <time dateTime={release.published_at} className="text-xs text-wiki-text-muted shrink-0">
                  {formatDate(release.published_at)}
                </time>
              </div>
              {release.body ? (
                <div
                  className="docs-content px-4 py-4"
                  // XSS Prevention: marked output is untrusted (from external API)
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(release.body) as string) }}
                />
              ) : (
                <p className="px-4 py-4 text-sm text-wiki-text-muted italic">No release notes.</p>
              )}
            </div>
          ))}
        </div>
      ) : commits.length > 0 ? (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-wiki-tab-bg">
              <th className="border border-wiki-border px-3 py-1.5 text-left font-medium w-32">Date</th>
              <th className="border border-wiki-border px-3 py-1.5 text-left font-medium">Change</th>
              <th className="border border-wiki-border px-3 py-1.5 text-left font-medium w-20">Commit</th>
            </tr>
          </thead>
          <tbody>
            {commits.map((c, i) => (
              <tr key={c.sha} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
                <td className="border border-wiki-border px-3 py-1.5 text-wiki-text-muted whitespace-nowrap">
                  {formatDate(c.commit.author.date)}
                </td>
                <td className="border border-wiki-border px-3 py-1.5">
                  {commitTitle(c.commit.message)}
                </td>
                <td className="border border-wiki-border px-3 py-1.5">
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-wiki-link hover:underline"
                  >
                    {c.sha.slice(0, 7)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="border border-wiki-border-light bg-wiki-offwhite p-6 text-center">
          <p className="text-sm text-wiki-text-muted mb-2">No releases published yet.</p>
          <a
            href={`https://github.com/aicoder2009/opencitation/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wiki-link hover:underline text-sm"
          >
            Watch for updates on GitHub →
          </a>
        </div>
      )}
    </div>
  );
}
