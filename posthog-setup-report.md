<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. The existing PostHog setup was already comprehensive — `instrumentation-client.ts` initialises the client, `next.config.ts` has the reverse proxy, `src/lib/posthog-server.ts` provides the server-side singleton, and `PostHogIdentify` links Clerk users to PostHog profiles. This run supplemented the existing coverage by adding four new events to three previously untracked files, and refreshed the environment variable values.

**Files edited this run:**
- `src/app/home/page.tsx` — added `posthog-js` import and two capture calls in the quick-add and source-type-click handlers
- `src/app/embed/page.tsx` — added `posthog-js` import and a capture call in the copy handler
- `src/app/api/report-issue/route.ts` — added Clerk `auth()`, `getPostHogClient()` import, and a server-side capture after a successful GitHub issue creation

| Event | Description | File |
|---|---|---|
| `quick_add_initiated` | User clicked Generate Citation from the dashboard quick add input | `src/app/home/page.tsx` |
| `dashboard_source_type_clicked` | User clicked a source type button on the dashboard manual entry section | `src/app/home/page.tsx` |
| `embed_badge_code_copied` | User copied the embed badge code (HTML or Markdown format) | `src/app/embed/page.tsx` |
| `issue_reported` | User successfully submitted an issue report via the report form | `src/app/api/report-issue/route.ts` |

**Pre-existing events (tracked before this run):**
`lookup_performed`, `citation_generated`, `citation_copied`, `citation_saved_to_list`, `citation_deleted`, `citations_copied_all`, `citations_bulk_copied`, `citations_bulk_deleted`, `citation_exported`, `citations_reformatted`, `citations_sorted`, `citation_reordered`, `citation_edited`, `list_created`, `list_deleted`, `project_created`, `project_updated`, `project_deleted`, `list_removed_from_project`, `list_added_to_project`, `citation_added_to_list` (server-side), `share_link_created` (server-side), `share_page_viewed`, `share_all_copied`, `share_citation_copied`, `share_exported`

## Next steps

We've built a dashboard and five insights to track the most important user behavior:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/399086/dashboard/1517383
- **Citation Generation Funnel** (lookup → generate → save): https://us.posthog.com/project/399086/insights/xCIDBQyP
- **Citations Generated Over Time** (daily trend): https://us.posthog.com/project/399086/insights/MUKm8sAq
- **Export Format Breakdown** (bibtex, ris, txt, md, etc.): https://us.posthog.com/project/399086/insights/4ztTQcqO
- **List & Project Creation Trend** (retention signal): https://us.posthog.com/project/399086/insights/L5YZKEhR
- **Share Page Engagement** (viral/sharing behavior): https://us.posthog.com/project/399086/insights/m5C6x5wp

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
