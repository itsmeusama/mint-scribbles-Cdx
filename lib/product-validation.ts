import { isProductCategory, isProductVisual, type ProductCategory, type ProductVisual } from "./catalog";

export type ProductInput = {
  name: string;
  pricePence: number;
  category: ProductCategory;
  description: string;
  contents: string;
  visual: ProductVisual;
  badge: string;
  available: boolean;
  archived: boolean;
};

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function parseProductInput(payload: Record<string, unknown>):
  | { value: ProductInput; error?: never }
  | { value?: never; error: string } {
  const name = text(payload.name, 120);
  const description = text(payload.description, 500);
  const contents = text(payload.contents, 500);
  const badge = text(payload.badge, 40);
  const pricePence = payload.pricePence;

  if (name.length < 2) return { error: "Enter a product name." };
  if (!Number.isInteger(pricePence) || (pricePence as number) < 50 || (pricePence as number) > 1000000) {
    return { error: "Enter a valid product price." };
  }
  if (!isProductCategory(payload.category)) return { error: "Choose a product category." };
  if (description.length < 5) return { error: "Enter a short product description." };
  if (!isProductVisual(payload.visual)) return { error: "Choose a product visual." };

  return {
    value: {
      name,
      pricePence: pricePence as number,
      category: payload.category,
      description,
      contents,
      visual: payload.visual,
      badge,
      available: payload.available !== false,
      archived: payload.archived === true,
    },
  };
}
