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

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

const REPO = "aicoder2009/opencitation";
const GH_HEADERS = {
  "User-Agent": "opencitation-app",
  Accept: "application/vnd.github+json",
};

export async function getGitHubReleases(): Promise<GitHubRelease[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases`,
      { headers: GH_HEADERS, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: GitHubRelease[] = await res.json();
    return data.filter((r) => !r.draft);
  } catch {
    return [];
  }
}

export async function getGitHubCommits(limit = 30): Promise<GitHubCommit[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?per_page=${limit}`,
      { headers: GH_HEADERS, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
