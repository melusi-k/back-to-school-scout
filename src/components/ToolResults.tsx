import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog";
import { Package } from "lucide-react";

type VariantOut = {
  id: string;
  title: string;
  price: number;
  available: boolean;
};

type ProductOut = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  variants: VariantOut[];
} | null;

export function ProductResults({ output }: { output: unknown }) {
  const data = output as { products?: ProductOut[] } | undefined;
  const products = (data?.products ?? []).filter(Boolean) as NonNullable<ProductOut>[];
  if (products.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {products.map((p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const available = variants.filter((v) => v?.available);
        const prices = available.length > 0 ? available : variants;
        const priceValues = prices
          .map((v) => v?.price)
          .filter((v): v is number => typeof v === "number");
        const minPrice = priceValues.length ? Math.min(...priceValues) : null;
        const maxPrice = priceValues.length ? Math.max(...priceValues) : null;
        const priceLabel =
          minPrice === null || maxPrice === null
            ? ""
            : minPrice === maxPrice
              ? formatPrice(minPrice)
              : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;

        return (
          <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            {p.image && (
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="size-16 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{p.title}</p>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {priceLabel}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {p.category}
                </Badge>
                {p.variants.slice(0, 4).map((v) => (
                  <Badge
                    key={v.id}
                    variant={v.available ? "outline" : "secondary"}
                    className={`text-[10px] ${v.available ? "" : "opacity-40"}`}
                  >
                    {v.title.replace(/^[A-Z]+\s*\/\s*/, "")}
                  </Badge>
                ))}
                {p.variants.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{p.variants.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChecklistToolResult({ output }: { output: unknown }) {
  const data = output as { items?: { id: string; label: string; size: string }[] } | undefined;
  const items = data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Added to checklist:{" "}
      {items.map((i) => `${i.label}${i.size ? ` (${i.size})` : ""}`).join(", ")}
    </p>
  );
}

export { Package };
