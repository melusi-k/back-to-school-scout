import { createFileRoute } from "@tanstack/react-router";

import { WidgetChat } from "@/components/WidgetChat";

export const Route = createFileRoute("/widget")({
  head: () => ({
    meta: [
      { title: "Back to School Scout — Ackermans" },
      {
        name: "description",
        content:
          "Floating shopping assistant that matches Ackermans school items to your child's grade and sizes and builds a checklist.",
      },
      { property: "og:title", content: "Back to School Scout — Ackermans" },
      {
        property: "og:description",
        content: "Grade- and size-matched school shopping, right on the page you're browsing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WidgetChat,
});
