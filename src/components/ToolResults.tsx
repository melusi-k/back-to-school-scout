import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/catalog";
import { Package, Tag } from "lucide-react";

type ProductOut = {
  id: string;
  title: string;
  category: string;
  price: number;
  sizes: string[];
  description: string;
} | null;

export function ProductResults({ output }: { output: unknown }) {
  const data = output as { products?: ProductOut[] } | undefined;
  const products = (data?.products ?? []).filter(Boolean) as NonNullable<ProductOut>[];
  if (products.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{p.title}</p>
            <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {p.category}
            </Badge>
            {p.sizes.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type BundleOut = {
  id: string;
  title: string;
  description: string;
  bundlePrice: number;
  savings: number;
  products: ProductOut[];
};

export function BundleResults({ output }: { output: unknown }) {
  const data = output as { bundles?: BundleOut[] } | undefined;
  const bundles = data?.bundles ?? [];
  if (bundles.length === 0) return null;

  return (
    <div className="space-y-2">
      {bundles.map((b) => (
        <div key={b.id} className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="size-3.5 text-primary" aria-hidden />
              {b.title}
            </p>
            <span className="text-sm font-semibold tabular-nums">
              {formatPrice(b.bundlePrice)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {b.savings > 0 && (
              <Badge className="gap-1 text-[10px]">
                <Tag className="size-3" aria-hidden />
                Save {formatPrice(b.savings)}
              </Badge>
            )}
            {b.products.filter(Boolean).map((p) => (
              <Badge key={p!.id} variant="outline" className="text-[10px]">
                {p!.title}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChecklistToolResult({ output }: { output: unknown }) {
  const data = output as { items?: { id: string; label: string; note: string }[] } | undefined;
  const items = data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Added to checklist: {items.map((i) => i.label).join(", ")}
    </p>
  );
}
