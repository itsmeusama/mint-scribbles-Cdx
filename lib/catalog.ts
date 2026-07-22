export type Product = {
  id: string;
  name: string;
  price: number;
  category: "Bundle" | "Individual" | "Custom";
  description: string;
  contents?: string;
  visual: string;
  badge?: string;
};

export const bundles: Product[] = [
  {
    id: "desk-reset",
    name: "The Desk Reset",
    price: 32,
    category: "Bundle",
    description: "A practical refresh for clear plans and calmer desks.",
    contents: "Sage notebook · weekly pad · brass bookmark · black pencil",
    visual: "desk",
    badge: "Bestseller",
  },
  {
    id: "correspondence-set",
    name: "The Correspondence Set",
    price: 26,
    category: "Bundle",
    description: "A thoughtful edit for notes worth sending by hand.",
    contents: "8 writing sheets · 8 envelopes · 4 cards · sealing stickers",
    visual: "letter",
    badge: "Gift-ready",
  },
  {
    id: "study-edit",
    name: "The Study Edit",
    price: 29,
    category: "Bundle",
    description: "A focused set for lectures, lists and deadline days.",
    contents: "Project notebook · index cards · sticky tabs · 2 pencils",
    visual: "study",
    badge: "New edit",
  },
];

export const individualItems: Product[] = [
  { id: "notebook", name: "Layflat Notebook", price: 12, category: "Individual", description: "A5, 160 ruled pages, sage linen cover.", visual: "notebook" },
  { id: "weekly-pad", name: "Weekly Desk Pad", price: 8, category: "Individual", description: "Fifty tear-off sheets for a clearer week.", visual: "pad" },
  { id: "notecards", name: "Botanical Notecards", price: 10, category: "Individual", description: "Six cards with warm ivory envelopes.", visual: "cards" },
  { id: "pencils", name: "Writing Pencil Pair", price: 4, category: "Individual", description: "Forest lacquer with soft graphite cores.", visual: "pencils" },
  { id: "tabs", name: "Paper Index Tabs", price: 5, category: "Individual", description: "Four muted shades, 120 tabs in total.", visual: "tabs" },
  { id: "bookmark", name: "Brass Page Marker", price: 7, category: "Individual", description: "A slim, reusable marker with a soft sheen.", visual: "marker" },
];

export const purchasableProducts = [...bundles, ...individualItems];

export function findProduct(productId: string) {
  return purchasableProducts.find((product) => product.id === productId);
}
