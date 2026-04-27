<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into OpenCitation. The following changes were made:

- **`instrumentation-client.ts`** (new): Initialises PostHog client-side using the Next.js 15.3+ `instrumentation-client` pattern — no provider component required. Enables automatic session replay, exception capture, and pageview tracking.
- **`next.config.ts`**: Added reverse-proxy rewrites for `/ingest/*` → PostHog ingestion, plus `skipTrailingSlashRedirect: true`. This improves ad-blocker resilience.
- **`src/lib/posthog-server.ts`** (new): Singleton `posthog-node` client for server-side event capture in API routes.
- **`src/components/posthog-identify.tsx`** (new): Client component that calls `posthog.identify()` on app load using Clerk user data (ID, email, name). Included in root layout so every authenticated session is linked to a person profile.
- **`src/app/layout.tsx`**: Imported and rendered `<PostHogIdentify />` inside the PWA provider.
- **`src/app/cite/page.tsx`**: Added `lookup_performed`, `citation_generated` (lookup & manual paths), `citation_copied`, `citation_saved_to_list`, and `posthog.captureException()` on citation-save failure.
- **`src/app/lists/page.tsx`**: Added `list_created` and `list_deleted` events.
- **`src/app/projects/page.tsx`**: Added `project_created` event.
- **`src/app/lists/[id]/page.tsx`**: Added `citation_exported` event on all 7 export formats (txt, md, html, rtf, bibtex, ris, ris_zotero, csl_json).
- **`src/app/api/share/route.ts`**: Server-side `share_link_created` event via `posthog-node` after successful share link creation.
- **`src/app/api/lists/[id]/citations/route.ts`**: Server-side `citation_added_to_list` event via `posthog-node` after citation is persisted to DynamoDB.

| Event | Description | File |
|---|---|---|
| `lookup_performed` | Auto-lookup via URL, DOI, ISBN, or arXiv | `src/app/cite/page.tsx` |
| `citation_generated` | Citation successfully generated (lookup or manual) | `src/app/cite/page.tsx` |
| `citation_copied` | Formatted citation copied to clipboard | `src/app/cite/page.tsx` |
| `citation_saved_to_list` | Citation saved to a list (client-side confirmation) | `src/app/cite/page.tsx` |
| `citation_added_to_list` | Citation persisted to database (server-side) | `src/app/api/lists/[id]/citations/route.ts` |
| `citation_exported` | Citations exported to file (format tracked as property) | `src/app/lists/[id]/page.tsx` |
| `list_created` | User created a new citation list | `src/app/lists/page.tsx` |
| `list_deleted` | User deleted a citation list | `src/app/lists/page.tsx` |
| `project_created` | User created a new project | `src/app/projects/page.tsx` |
| `share_link_created` | Public share link created (server-side) | `src/app/api/share/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/399086/dashboard/1513735
- **Citation generation funnel** (lookup → generated → saved): https://us.posthog.com/project/399086/insights/GaUla2xp
- **Daily citations generated** (30-day line chart): https://us.posthog.com/project/399086/insights/dP8EToDj
- **Export format breakdown** (bar chart by format): https://us.posthog.com/project/399086/insights/cHj976v3
- **Lookup type breakdown** (URL vs DOI vs ISBN vs arXiv): https://us.posthog.com/project/399086/insights/7jMKcCu5
- **Organization activity** (lists, projects, shares per week): https://us.posthog.com/project/399086/insights/pzO9ftM7

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
