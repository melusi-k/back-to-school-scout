import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        items: z
          .array(
            z.object({
              variantId: z.string(),
              quantity: z.number().min(1).default(1),
            }),
          )
          .min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createCart } = await import("@/lib/shopify.server");
    return createCart(data.items);
  });
