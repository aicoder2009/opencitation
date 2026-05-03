export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

export async function getGitHubReleases(): Promise<GitHubRelease[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/aicoder2009/opencitation/releases",
      {
        headers: {
          "User-Agent": "opencitation-app",
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data: GitHubRelease[] = await res.json();
    return data.filter((r) => !r.draft);
  } catch {
    return [];
  }
}
