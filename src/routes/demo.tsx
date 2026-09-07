import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Scout on your storefront — live demo" },
      {
        name: "description",
        content:
          "See the Back to School Scout chat widget hovering on a sample Ackermans storefront page, exactly as shoppers will.",
      },
      { property: "og:title", content: "Scout on your storefront — live demo" },
      {
        property: "og:description",
        content: "A sample storefront page with the floating Back to School Scout widget attached.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/scout-widget.js";
    script.defer = true;
    script.setAttribute("data-label", "Back to School Scout");
    document.body.appendChild(script);
    return () => {
      script.remove();
      document.querySelector(".satchel-scout-frame")?.remove();
      document.querySelector(".satchel-scout-launcher")?.remove();
      // allow re-injection on next mount
      (window as unknown as Record<string, unknown>)["__satchelScoutLoaded"] = false;
    };
  }, []);

  const snippet = `<script src="${typeof window === "undefined" ? "https://your-app-domain" : window.location.origin}/scout-widget.js" defer
        data-label="Back to School Scout"
        data-position="right"></script>`;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-extrabold tracking-tight text-primary">ackermans</span>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <span>Women</span>
            <span>Men</span>
            <span>Kids</span>
            <span className="font-semibold text-foreground">Back to School</span>
            <span>Home</span>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Back to school
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight md:text-4xl">
          Sorted for the new term, without the guesswork
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          This is a sample storefront page. The Scout widget in the bottom corner is exactly what
          shoppers will see once the snippet is added to your site.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["School shoes", "Shirts & blouses", "Trousers & skirts", "Jerseys"].map((title) => (
            <div key={title} className="rounded-lg border border-border bg-card p-4">
              <div className="aspect-square rounded-md bg-muted" />
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">Shop the range</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Add it to your live site</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste this once before <code>&lt;/body&gt;</code> in your theme layout. It loads the
            floating button on every page.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {snippet}
          </pre>
        </div>
      </section>
    </main>
  );
}
