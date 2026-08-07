import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatPrice } from "@/lib/catalog";
import { createCheckout } from "@/lib/checkout.functions";
import type { ChecklistItem } from "@/lib/threads";
import { Trash2, ListChecks, ShoppingBag, Loader2 } from "lucide-react";

type Props = {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ChecklistPanel({ items, onToggle, onRemove }: Props) {
  const [checkingOut, setCheckingOut] = useState(false);
  const fetchCheckout = useServerFn(createCheckout);

  const done = items.filter((i) => i.done).length;
  const total = items.reduce((sum, i) => sum + (i.done ? 0 : i.price), 0);
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const checkoutItems = items.filter((i) => !i.done && i.variantId);

  const handleCheckout = async () => {
    if (checkoutItems.length === 0) return;
    setCheckingOut(true);
    try {
      const result = await fetchCheckout({
        data: { items: checkoutItems.map((i) => ({ variantId: i.variantId, quantity: 1 })) },
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      setCheckingOut(false);
    }
  };

  return (
    <aside className="flex h-full flex-col border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ListChecks className="size-4 text-primary" aria-hidden />
          Shopping checklist
        </h2>
        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {done} of {items.length} packed · {formatPrice(total)} still to buy
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Nothing here yet. Tell Satchel your child's grade and sizes and the items you agree on
            will land here automatically.
          </p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, group]) => (
              <div key={category}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
                <ul className="space-y-1.5">
                  {group.map((item) => (
                    <li
                      key={item.id}
                      className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.done}
                        onCheckedChange={() => onToggle(item.id)}
                        className="mt-0.5"
                      />
                      <label htmlFor={item.id} className="flex-1 cursor-pointer text-sm">
                        <span className={item.done ? "line-through opacity-50" : ""}>
                          {item.label}
                        </span>
                        {item.size && (
                          <span className="block text-xs text-muted-foreground">
                            {item.size}
                          </span>
                        )}
                        {item.note && item.note !== item.size && (
                          <span className="block text-xs text-muted-foreground">{item.note}</span>
                        )}
                      </label>
                      {item.price > 0 && (
                        <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatPrice(item.price, item.currencyCode || "ZAR")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.label}`}
                        onClick={() => onRemove(item.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {checkoutItems.length > 0 && (
        <div className="border-t border-border p-4">
          <Button
            className="w-full gap-2"
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Going to checkout…
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden />
                Checkout {checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""} ·{" "}
                {formatPrice(total)}
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Opens Ackermans secure checkout
          </p>
        </div>
      )}
    </aside>
  );
}
