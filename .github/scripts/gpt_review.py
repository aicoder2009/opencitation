#!/usr/bin/env python3
import json
import os
import subprocess
import sys

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from env

PR_NUMBER = os.environ["PR_NUMBER"]
REPO = os.environ["REPO"]

# Gather PR data
diff = subprocess.check_output(
    ["gh", "pr", "diff", PR_NUMBER, "--repo", REPO]
).decode(errors="replace")

if len(diff) > 60_000:
    diff = diff[:60_000] + "\n\n... (diff truncated)"

pr_meta = json.loads(
    subprocess.check_output(
        ["gh", "pr", "view", PR_NUMBER, "--repo", REPO,
         "--json", "title,body,additions,deletions,changedFiles"]
    ).decode()
)

# Call GPT-5
prompt = f"""Review this pull request for a Next.js 16 / React 19 / Tailwind CSS 4 / DynamoDB citation-manager app.

PR title: {pr_meta['title']}
Description: {pr_meta.get('body') or 'None'}
Stats: +{pr_meta['additions']} -{pr_meta['deletions']} across {pr_meta['changedFiles']} files

Diff:
{diff}

Return ONLY a JSON object:
{{
  "verdict": "approve" | "request_changes",
  "summary": "<2-3 sentence overall assessment>",
  "issues": [
    {{
      "severity": "critical" | "major" | "minor",
      "file": "<path>",
      "line": <line number or null>,
      "message": "<description>"
    }}
  ]
}}

Severity rules:
- critical = security hole, data loss, broken auth, XSS/injection
- major = logic bug, significant code smell, missing error handling
- minor = style, naming, small improvements
Approve only when there are zero critical or major issues.
"""

response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "You are a senior code reviewer. Respond only with valid JSON."},
        {"role": "user", "content": prompt},
    ],
    response_format={"type": "json_object"},
    temperature=0.1,
)

result = json.loads(response.choices[0].message.content)
verdict = result.get("verdict", "request_changes")
summary = result.get("summary", "")
issues = result.get("issues", [])

# Format review body
icon = {"critical": "🔴", "major": "🟠", "minor": "🟡"}
body = f"## GPT-5 Code Review\n\n{summary}\n"

if issues:
    body += "\n### Issues\n\n"
    for issue in issues:
        sev = issue.get("severity", "minor")
        line = issue.get("line")
        loc = f"`{issue.get('file', '?')}:{line}`" if line else f"`{issue.get('file', '?')}`"
        body += f"{icon.get(sev, '•')} **{sev.upper()}** {loc} — {issue['message']}\n\n"

# Post review
review_flag = "--approve" if verdict == "approve" else "--request-changes"
subprocess.run(
    ["gh", "pr", "review", PR_NUMBER, "--repo", REPO, review_flag, "--body", body],
    check=True,
)

# Apply label based on outcome
label = "auto-merged" if verdict == "approve" else "needs-human"
subprocess.run(
    ["gh", "pr", "edit", PR_NUMBER, "--repo", REPO, "--add-label", label],
    check=False,
)

# Merge if approved
if verdict == "approve":
    subprocess.run(
        ["gh", "pr", "merge", PR_NUMBER, "--repo", REPO, "--squash", "--delete-branch"],
        check=True,
    )
    print("✅ Approved and merged.")
else:
    critical_count = sum(1 for i in issues if i.get("severity") == "critical")
    major_count = sum(1 for i in issues if i.get("severity") == "major")
    print(f"❌ Changes requested ({critical_count} critical, {major_count} major). Not merging.")
    sys.exit(0)
