import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getSchoolProducts, findVariant } from "@/lib/shopify.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are "Satchel", a warm, efficient back-to-school shopping assistant for parents shopping at Ackermans, a South African retailer.

Your job:
1. Find out, conversationally, who they are shopping for: the child's first name, age, grade, clothing size and shoe size. Ask for at most two of these at a time and never interrogate — if a parent gives you partial info, work with it and fill gaps later.
2. Once you know grade (and ideally sizes), call recommend_products to pull items from the school collection.
3. Call add_to_checklist to put agreed items on the parent's tracked checklist. Always pass the specific variantId for the size you recommend so the parent can check out directly from the checklist.

Rules:
- Only recommend items that came back from your tools. Never invent products or prices.
- Recommend a size explicitly when you know the child's age/size, e.g. "School shirt in 7-8 YRS".
- Variant sizes use formats like "5-6 YRS", "7-8 YRS", "9-10 YRS", "11-12 YRS", "13-14 YRS" for clothing. Shoe sizes are numeric (e.g. "13", "1", "2", "3"). Some variants also include a colour, e.g. "BLACK / 7-8 YRS".
- Keep replies short, friendly and scannable. Use short markdown bullets, no long paragraphs.
- Prices are in South African Rand (ZAR). Mention the price when suggesting an item.
- If a product has no matching size in stock, say so and suggest the closest available size.
- The checklist lives in a panel next to the chat, so say "added to your checklist" rather than repeating the whole list.
- Suggest complementary items naturally — e.g. if they're buying a school shirt, mention trousers and shoes that complete the uniform.`;

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
};

const productPayload = async (product: Awaited<ReturnType<typeof getSchoolProducts>>[number]): Promise<ProductOut> => ({
  id: product.id,
  title: product.title,
  category: product.category,
  description: product.description,
  image: product.imageUrl,
  variants: product.variants.map((v) => ({
    id: v.id,
    title: v.title,
    price: v.price,
    available: v.available,
  })),
});

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
                "Search the Ackermans school collection for products, optionally filtered by category. Returns each product with its available variants (sizes and prices).",
              inputSchema: z.object({
                categories: z
                  .array(z.string())
                  .describe(
                    "Categories to include: Shoes, Shirts, Trousers, Skirts, Shorts, Jerseys, Rainwear, Socks & Tights, Drinkware & Lunch, Accessories, Swimwear, Polos, Sportswear. Empty for all school items.",
                  ),
              }),
              execute: async ({ categories }) => {
                const all = await getSchoolProducts();
                const cats = categories.map((c) => c.toLowerCase());
                const filtered = cats.length === 0
                  ? all
                  : all.filter((p) => cats.includes(p.category.toLowerCase()));
                const products = await Promise.all(filtered.map(productPayload));
                return { count: products.length, products };
              },
            }),
            add_to_checklist: tool({
              description:
                "Add items to the parent's back-to-school checklist. Pass the variantId from a recommended product so the item can be checked out directly.",
              inputSchema: z.object({
                items: z.array(
                  z.object({
                    variantId: z
                      .string()
                      .describe(
                        "Shopify variant ID from recommend_products for the chosen size. Empty string for custom reminders.",
                      ),
                    label: z.string().describe("Product name as shown to the parent."),
                    note: z.string().describe("Size, colour or reminder. Empty string if none."),
                  }),
                ),
              }),
              execute: async ({ items }) => {
                const resolved = await Promise.all(
                  items.map(async (item) => {
                    if (!item.variantId) {
                      return {
                        id: `custom_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                        productId: "",
                        variantId: "",
                        label: item.label,
                        note: item.note,
                        category: "Extras",
                        price: 0,
                        currencyCode: "ZAR",
                        size: "",
                      };
                    }
                    const found = await findVariant(item.variantId);
                    if (!found) {
                      return {
                        id: item.variantId,
                        productId: "",
                        variantId: item.variantId,
                        label: item.label,
                        note: item.note,
                        category: "Extras",
                        price: 0,
                        currencyCode: "ZAR",
                        size: "",
                      };
                    }
                    return {
                      id: found.variant.id,
                      productId: found.product.id,
                      variantId: found.variant.id,
                      label: found.product.title,
                      note: item.note,
                      category: found.product.category,
                      price: found.variant.price,
                      currencyCode: found.variant.currencyCode,
                      size: found.variant.title,
                    };
                  }),
                );
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
