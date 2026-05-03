import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiDocsSidebar } from "@/components/wiki/docs-sidebar";
import { DocsEditLink } from "@/components/wiki/docs-edit-link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiLayout>
      <div className="flex gap-6 items-start">
        <WikiDocsSidebar />
        <article className="flex-1 min-w-0">
          {children}
          <DocsEditLink />
        </article>
      </div>
    </WikiLayout>
  );
}
