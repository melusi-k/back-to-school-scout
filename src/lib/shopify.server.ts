/**
 * Shopify Storefront API client (server-only).
 * Uses the public storefront access token from env. Products tagged
 * "School" are fetched once and cached for an hour.
 */

const SHOPIFY_DOMAIN = "ackermans-za.myshopify.com";
const API_VERSION = "2025-01";
const API_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

export type ShopifyVariant = {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  available: boolean;
  options: { name: string; value: string }[];
};

export type ShopifyProduct = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  productType: string;
  category: string;
  variants: ShopifyVariant[];
  imageUrl: string | null;
  imageAlt: string | null;
  onlineStoreUrl: string | null;
};

type StorefrontResponse<T> = { data: T; errors?: { message: string }[] };

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = process.env["SHOPIFY_STOREFRONT_ACCESS_TOKEN"];
  if (!token) throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Storefront API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as StorefrontResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  return json.data;
}

function deriveCategory(tags: string[], productType: string): string {
  const t = [...tags, productType].join(" ").toLowerCase();
  if (t.includes("shoe")) return "Shoes";
  if (t.includes("shirt")) return "Shirts";
  if (t.includes("trouser") || t.includes("pants")) return "Trousers";
  if (t.includes("skirt")) return "Skirts";
  if (t.includes("short")) return "Shorts";
  if (t.includes("jersey") || t.includes("pullover")) return "Jerseys";
  if (t.includes("rain")) return "Rainwear";
  if (t.includes("sock") || t.includes("tight")) return "Socks & Tights";
  if (t.includes("drinkware") || t.includes("lunchbox") || t.includes("bottle"))
    return "Drinkware & Lunch";
  if (t.includes("belt")) return "Accessories";
  if (t.includes("swim")) return "Swimwear";
  if (t.includes("golfer") || t.includes("polo")) return "Polos";
  if (t.includes("sportswear") || t.includes("pe ")) return "Sportswear";
  return productType || "School";
}

const PRODUCTS_QUERY = `#graphql
  query SchoolProducts {
    products(first: 100, query: "tag:'School'") {
      edges {
        node {
          id
          title
          description
          tags
          productType
          featuredImage { url altText }
          onlineStoreUrl
          variants(first: 30) {
            edges {
              node {
                id
                title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

let productCache: { products: ShopifyProduct[]; at: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type RawProducts = {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        description: string;
        tags: string[];
        productType: string;
        featuredImage: { url: string; altText: string } | null;
        onlineStoreUrl: string | null;
        variants: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              price: { amount: string; currencyCode: string };
              availableForSale: boolean;
              selectedOptions: { name: string; value: string }[];
            };
          }>;
        };
      };
    }>;
  };
};

export async function getSchoolProducts(): Promise<ShopifyProduct[]> {
  if (productCache && Date.now() - productCache.at < CACHE_TTL) {
    return productCache.products;
  }

  const data = await storefrontFetch<RawProducts>(PRODUCTS_QUERY);

  const products: ShopifyProduct[] = data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    description: node.description,
    tags: node.tags,
    productType: node.productType,
    category: deriveCategory(node.tags, node.productType),
    variants: node.variants.edges.map(({ node: v }) => ({
      id: v.id,
      title: v.title,
      price: parseFloat(v.price.amount),
      currencyCode: v.price.currencyCode,
      available: v.availableForSale,
      options: v.selectedOptions,
    })),
    imageUrl: node.featuredImage?.url ?? null,
    imageAlt: node.featuredImage?.altText ?? null,
    onlineStoreUrl: node.onlineStoreUrl,
  }));

  productCache = { products, at: Date.now() };
  return products;
}

export async function findVariant(
  variantId: string,
): Promise<{ variant: ShopifyVariant; product: ShopifyProduct } | null> {
  const products = await getSchoolProducts();
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { variant, product };
  }
  return null;
}

export async function findProduct(
  productId: string,
): Promise<ShopifyProduct | null> {
  const products = await getSchoolProducts();
  return products.find((p) => p.id === productId) ?? null;
}

const CART_MUTATION = `#graphql
  mutation CreateCart($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

type RawCart = {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function createCart(
  lines: { variantId: string; quantity: number }[],
): Promise<{ cartId: string; checkoutUrl: string }> {
  const cartLines = lines.map((l) => ({
    merchandiseId: l.variantId,
    quantity: l.quantity,
  }));

  const data = await storefrontFetch<RawCart>(CART_MUTATION, {
    lines: cartLines,
  });

  if (data.cartCreate.userErrors.length) {
    throw new Error(
      data.cartCreate.userErrors.map((e) => e.message).join(", "),
    );
  }

  const cart = data.cartCreate.cart;
  if (!cart) throw new Error("Failed to create cart");
  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}
