export const PRODUCT_CATEGORIES = ["Bundle", "Individual"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const PRODUCT_VISUALS = [
  "desk",
  "letter",
  "study",
  "notebook",
  "pad",
  "cards",
  "pencils",
  "tabs",
  "marker",
] as const;
export type ProductVisual = typeof PRODUCT_VISUALS[number];

export type Product = {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description: string;
  contents?: string;
  visual: ProductVisual;
  badge?: string;
  available: boolean;
  archived?: boolean;
  sortOrder?: number;
};

export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === "string" && PRODUCT_CATEGORIES.includes(value as ProductCategory);
}

export function isProductVisual(value: unknown): value is ProductVisual {
  return typeof value === "string" && PRODUCT_VISUALS.includes(value as ProductVisual);
}
