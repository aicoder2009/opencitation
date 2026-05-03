import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getGitHubReleases } from "@/lib/github";
import { marked } from "marked";

export const metadata = { title: "Changelog — OpenCitation" };

export const revalidate = 3600;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ChangelogPage() {
  const releases = await getGitHubReleases();

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Changelog" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Changelog</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Release history pulled from{" "}
        <a
          href="https://github.com/aicoder2009/opencitation/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wiki-link hover:underline"
        >
          GitHub Releases
        </a>
        .
      </p>

      {releases.length === 0 ? (
        <div className="border border-wiki-border-light bg-wiki-offwhite p-6 text-center">
          <p className="text-sm text-wiki-text-muted mb-2">No releases published yet.</p>
          <a
            href="https://github.com/aicoder2009/opencitation/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-wiki-link hover:underline text-sm"
          >
            Watch for updates on GitHub →
          </a>
        </div>
      ) : (
        <div className="space-y-0">
          {releases.map((release) => (
            <div
              key={release.id}
              className="border border-wiki-border-light mb-6"
            >
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
                <time
                  dateTime={release.published_at}
                  className="text-xs text-wiki-text-muted shrink-0"
                >
                  {formatDate(release.published_at)}
                </time>
              </div>
              {release.body ? (
                <div
                  className="docs-content px-4 py-4"
                  dangerouslySetInnerHTML={{
                    __html: marked(release.body) as string,
                  }}
                />
              ) : (
                <p className="px-4 py-4 text-sm text-wiki-text-muted italic">
                  No release notes.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
