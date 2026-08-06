import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { BUNDLES, PRODUCTS, bundleSavings, productById } from "@/lib/catalog";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are "Satchel", a warm, efficient back-to-school shopping assistant for parents.

Your job:
1. Find out, conversationally, who they are shopping for: the child's first name, age, grade, clothing size and shoe size. Ask for at most two of these at a time and never interrogate — if a parent gives you partial info, work with it and fill gaps later.
2. Once you know grade (and ideally sizes), call recommend_products to pull items from the school-supplies collection.
3. Call recommend_bundles to show pair-and-save options whenever two or more suggested items appear in the same bundle.
4. Call add_to_checklist to put agreed items on the parent's tracked checklist. Only add items the parent has shown interest in, or clear essentials you have just recommended and named.

Rules:
- Only recommend items that came back from your tools. Never invent products or prices.
- Recommend a size explicitly when you know the child's age/size, e.g. "Sneakers in US 2Y".
- Keep replies short, friendly and scannable. Use short markdown bullets, no long paragraphs.
- Prices are in USD. Mention the saving amount when you suggest a bundle.
- The checklist lives in a panel next to the chat, so say "added to your checklist" rather than repeating the whole list.`;

const productPayload = (id: string) => {
  const p = productById(id);
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    sizes: p.sizes ?? [],
    description: p.description,
  };
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          stopWhen: stepCountIs(50),
          tools: {
            recommend_products: tool({
              description:
                "Search the school-supplies collection for products suitable for a child's grade, optionally filtered by category.",
              inputSchema: z.object({
                grade: z
                  .string()
                  .describe("Grade label, e.g. 'Kindergarten', 'Grade 3'. Empty string if unknown."),
                categories: z
                  .array(z.string())
                  .describe("Categories to include: Bags, Uniform, Footwear, Stationery, Extras. Empty for all."),
              }),
              execute: async ({ grade, categories }) => {
                const cats = categories.map((c) => c.toLowerCase());
                const items = PRODUCTS.filter((p) => {
                  const gradeOk = !grade || p.grades.some((g) => g.toLowerCase() === grade.toLowerCase());
                  const catOk = cats.length === 0 || cats.includes(p.category.toLowerCase());
                  return gradeOk && catOk;
                }).map((p) => productPayload(p.id));
                return { grade, count: items.length, products: items };
              },
            }),
            recommend_bundles: tool({
              description:
                "Get pair-and-save bundles from the collection, optionally scoped to a grade. Use to show parents how to save.",
              inputSchema: z.object({
                grade: z.string().describe("Grade label, or empty string for all bundles."),
              }),
              execute: async ({ grade }) => {
                const bundles = BUNDLES.filter(
                  (b) => !grade || b.grades.some((g) => g.toLowerCase() === grade.toLowerCase()),
                ).map((b) => ({
                  id: b.id,
                  title: b.title,
                  description: b.description,
                  bundlePrice: b.bundlePrice,
                  savings: bundleSavings(b),
                  products: b.productIds.map((id) => productPayload(id)),
                }));
                return { count: bundles.length, bundles };
              },
            }),
            add_to_checklist: tool({
              description:
                "Add items to the parent's back-to-school checklist so they can track what is still to buy.",
              inputSchema: z.object({
                items: z.array(
                  z.object({
                    productId: z
                      .string()
                      .describe("Catalog product id if this is a catalog item, otherwise empty string."),
                    label: z.string().describe("What the parent sees on the checklist."),
                    note: z.string().describe("Size, quantity or reminder. Empty string if none."),
                  }),
                ),
              }),
              execute: async ({ items }) => {
                const resolved = items.map((item) => {
                  const p = item.productId ? productById(item.productId) : undefined;
                  return {
                    id: `${item.productId || "custom"}_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    productId: p?.id ?? "",
                    label: item.label,
                    note: item.note,
                    category: p?.category ?? "Extras",
                    price: p?.price ?? 0,
                  };
                });
                return { added: resolved.length, items: resolved };
              },
            }),
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
