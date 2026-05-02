import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiDocsSidebar } from "@/components/wiki/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiLayout>
      <div className="flex gap-6 items-start">
        <WikiDocsSidebar />
        <article className="flex-1 min-w-0">
          {children}
        </article>
      </div>
    </WikiLayout>
  );
}
