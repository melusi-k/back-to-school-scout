export type SchoolProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  grades: string[];
  sizes?: string[];
  description: string;
  handle: string;
};

export type SchoolBundle = {
  id: string;
  title: string;
  productIds: string[];
  bundlePrice: number;
  description: string;
  grades: string[];
};

export const GRADES = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
] as const;

const ALL = GRADES as unknown as string[];
const LOWER = ["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3"];
const UPPER = ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];

/**
 * Sample catalog standing in for the Shopify "School Supplies" collection.
 * Swap this module for live Shopify collection data once the store is connected.
 */
export const PRODUCTS: SchoolProduct[] = [
  {
    id: "p_backpack_classic",
    title: "Classic Everyday Backpack",
    category: "Bags",
    price: 44.0,
    currency: "USD",
    grades: ALL,
    sizes: ["Small (Pre-K–G2)", "Medium (G3–G5)", "Large (G6+)"],
    description: "Padded straps, laptop sleeve on Large, water-bottle pockets.",
    handle: "classic-everyday-backpack",
  },
  {
    id: "p_lunchbox",
    title: "Insulated Lunch Box",
    category: "Bags",
    price: 22.0,
    currency: "USD",
    grades: ALL,
    description: "Leak-resistant liner, keeps cold for 6 hours.",
    handle: "insulated-lunch-box",
  },
  {
    id: "p_water_bottle",
    title: "Stainless Water Bottle 500ml",
    category: "Bags",
    price: 16.0,
    currency: "USD",
    grades: ALL,
    description: "Dishwasher safe, spill-proof flip lid.",
    handle: "stainless-water-bottle",
  },
  {
    id: "p_polo",
    title: "Uniform Polo Shirt (2-pack)",
    category: "Uniform",
    price: 28.0,
    currency: "USD",
    grades: ALL,
    sizes: ["4", "5-6", "7-8", "9-10", "11-12", "13-14", "XS", "S", "M"],
    description: "Stain-release cotton pique in navy, white or sky blue.",
    handle: "uniform-polo-2-pack",
  },
  {
    id: "p_chinos",
    title: "Stretch School Chinos",
    category: "Uniform",
    price: 32.0,
    currency: "USD",
    grades: ALL,
    sizes: ["4", "5-6", "7-8", "9-10", "11-12", "13-14", "XS", "S", "M"],
    description: "Adjustable waistband, reinforced knees.",
    handle: "stretch-school-chinos",
  },
  {
    id: "p_pinafore",
    title: "Pleated School Skirt",
    category: "Uniform",
    price: 30.0,
    currency: "USD",
    grades: ALL,
    sizes: ["4", "5-6", "7-8", "9-10", "11-12", "13-14"],
    description: "Machine-washable pleats with built-in shorts.",
    handle: "pleated-school-skirt",
  },
  {
    id: "p_sneakers",
    title: "All-Day School Sneakers",
    category: "Footwear",
    price: 52.0,
    currency: "USD",
    grades: ALL,
    sizes: ["US 10C", "US 12C", "US 13C", "US 1Y", "US 2Y", "US 3Y", "US 4Y", "US 5Y", "US 6Y"],
    description: "Scuff-resistant toe, machine washable, hook-and-loop or lace.",
    handle: "all-day-school-sneakers",
  },
  {
    id: "p_pe_kit",
    title: "PE Kit Set (tee + shorts)",
    category: "Footwear",
    price: 26.0,
    currency: "USD",
    grades: ALL,
    sizes: ["4", "5-6", "7-8", "9-10", "11-12", "13-14"],
    description: "Breathable mesh, name label patch inside.",
    handle: "pe-kit-set",
  },
  {
    id: "p_crayons",
    title: "Jumbo Crayons & Washable Markers",
    category: "Stationery",
    price: 12.0,
    currency: "USD",
    grades: LOWER,
    description: "Easy-grip barrels for little hands.",
    handle: "jumbo-crayons-markers",
  },
  {
    id: "p_pencil_case",
    title: "Zip Pencil Case, Fully Stocked",
    category: "Stationery",
    price: 18.0,
    currency: "USD",
    grades: ALL,
    description: "Pencils, eraser, sharpener, ruler, glue stick and scissors.",
    handle: "stocked-pencil-case",
  },
  {
    id: "p_notebooks",
    title: "Ruled Exercise Books (5-pack)",
    category: "Stationery",
    price: 14.0,
    currency: "USD",
    grades: ALL,
    description: "80 pages each, wide-ruled for lower grades.",
    handle: "ruled-exercise-books",
  },
  {
    id: "p_geometry",
    title: "Geometry & Scientific Calculator Set",
    category: "Stationery",
    price: 34.0,
    currency: "USD",
    grades: UPPER,
    description: "Compass, protractor set and exam-approved calculator.",
    handle: "geometry-calculator-set",
  },
  {
    id: "p_art_kit",
    title: "Art Class Kit",
    category: "Stationery",
    price: 24.0,
    currency: "USD",
    grades: ALL,
    description: "Sketchpad, watercolours, brushes and apron.",
    handle: "art-class-kit",
  },
  {
    id: "p_labels",
    title: "Iron-On Name Labels (60)",
    category: "Extras",
    price: 11.0,
    currency: "USD",
    grades: ALL,
    description: "Custom printed with your child's name.",
    handle: "iron-on-name-labels",
  },
  {
    id: "p_raincoat",
    title: "Packable Rain Jacket",
    category: "Extras",
    price: 38.0,
    currency: "USD",
    grades: ALL,
    sizes: ["4", "5-6", "7-8", "9-10", "11-12", "13-14"],
    description: "Folds into its own pocket, reflective trim.",
    handle: "packable-rain-jacket",
  },
];

export const BUNDLES: SchoolBundle[] = [
  {
    id: "b_first_day_starter",
    title: "First Day Starter Bundle",
    productIds: ["p_backpack_classic", "p_lunchbox", "p_water_bottle", "p_labels"],
    bundlePrice: 79.0,
    description: "Everything they carry in on day one — save on the essentials.",
    grades: ALL,
  },
  {
    id: "b_uniform_week",
    title: "Uniform Week Bundle",
    productIds: ["p_polo", "p_chinos", "p_sneakers"],
    bundlePrice: 99.0,
    description: "Five days of uniform sorted with one pair of everyday shoes.",
    grades: ALL,
  },
  {
    id: "b_little_learners",
    title: "Little Learners Bundle",
    productIds: ["p_crayons", "p_art_kit", "p_notebooks", "p_pencil_case"],
    bundlePrice: 58.0,
    description: "Craft-heavy supply set for Pre-K through Grade 3.",
    grades: LOWER,
  },
  {
    id: "b_middle_school",
    title: "Middle School Study Bundle",
    productIds: ["p_geometry", "p_notebooks", "p_pencil_case"],
    bundlePrice: 55.0,
    description: "Maths and science ready for Grade 4 and up.",
    grades: UPPER,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const bundleSavings = (bundle: SchoolBundle) => {
  const full = bundle.productIds.reduce((sum, id) => sum + (productById(id)?.price ?? 0), 0);
  return Math.max(0, Math.round((full - bundle.bundlePrice) * 100) / 100);
};

export const formatPrice = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
