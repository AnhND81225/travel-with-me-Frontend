import { storefrontAssets as images } from "../../data/storefront";

export function getProductImage(category?: string | null, name?: string | null, id?: number): string {
  const text = `${category || ""} ${name || ""}`.toLowerCase();
  if (text.includes("lều") || text.includes("tent") || text.includes("shelter")) return images.tent;
  if (text.includes("balo") || text.includes("pack") || text.includes("bag") || text.includes("túi")) return images.pack;
  if (text.includes("gậy") || text.includes("pole") || text.includes("trek")) return images.poles;
  if (text.includes("bếp") || text.includes("nấu") || text.includes("kitchen") || text.includes("cook") || text.includes("stove")) return images.kitchen;
  if (text.includes("giày") || text.includes("boot") || text.includes("shoe")) return images.hike;
  const list = [images.tent, images.pack, images.poles, images.kitchen, images.camp, images.hike];
  return list[(id || 0) % list.length];
}
