import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ensureThreads } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Satchel — Back-to-School Shopping Assistant" },
      {
        name: "description",
        content:
          "Chat with Satchel to get grade- and size-matched school supplies from Ackermans and track everything on one checklist.",
      },
      { property: "og:title", content: "Satchel — Back-to-School Shopping Assistant" },
      {
        property: "og:description",
        content:
          "Grade- and size-matched school shopping from Ackermans, with a checklist that tracks itself.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const threads = ensureThreads();
    const first = threads[0];
    if (first) {
      void navigate({ to: "/c/$threadId", params: { threadId: first.id }, replace: true });
    }
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Satchel</h1>
        <p className="mt-2 text-sm text-muted-foreground">Getting your checklist ready…</p>
      </div>
    </main>
  );
}
