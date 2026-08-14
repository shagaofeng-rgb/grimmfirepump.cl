import Image from "next/image";
import type { ChileProduct } from "@/lib/chile-content";

const imageBySourceSlug: Record<string, string> = {
  "2-electric-plus-jockey-pump-set": "/assets/products/2-electric-plus-jockey-pump-set.jpg",
  "diesel-engine-fire-pump": "/assets/products/diesel-engine-fire-pump.png",
  "diesel-engine-irrigation-pump-trailer-type": "/assets/products/diesel-engine-irrigation-pump-trailer-type.jpg",
  "diesel-engine-long-shaft-fire-pump": "/assets/products/diesel-engine-long-shaft-fire-pump.png",
  "diesel-engine-plus-jockey-pump-set": "/assets/products/diesel-engine-plus-jockey-pump-set.jpg",
  "edj-fire-pump-set": "/assets/products/edj-fire-pump-set.jpg",
  "electric-horizontal-split-end-suction-pump": "/assets/products/electric-horizontal-split-end-suction-pump.png",
  "electric-long-shaft-fire-pump": "/assets/products/electric-long-shaft-fire-pump.png",
  "frequency-conversion-water-supply-equipment": "/assets/products/frequency-conversion-water-supply-equipment.jpg",
  "horizontal-booster-pump-group": "/assets/products/horizontal-booster-pump-group.jpg",
  "integrated-prefabricated-pump-station-frp": "/assets/products/integrated-prefabricated-pump-station-frp.jpg",
  "submersible-sewage-pump": "/assets/products/submersible-sewage-pump.png",
  "vertical-stainless-steel-multistage-pump-jockey-pump": "/assets/products/vertical-stainless-steel-multistage-pump-jockey-pump.png",
  "sistema-bomba-incendio-edj": "/assets/products/edj-fire-pump-set.jpg",
  "bomba-diesel-contra-incendio": "/assets/products/diesel-engine-plus-jockey-pump-set.jpg",
  "bomba-electrica-contra-incendio": "/assets/products/2-electric-plus-jockey-pump-set.jpg",
  "bomba-jockey-contra-incendio": "/assets/products/vertical-stainless-steel-multistage-pump-jockey-pump.png",
  "bomba-incendio-eje-largo": "/assets/products/electric-long-shaft-fire-pump.png",
};

function fallbackImage(product: ChileProduct) {
  if (product.category?.includes("Aguas servidas")) return "/assets/products/submersible-sewage-pump.png";
  if (product.category?.includes("Abastecimiento")) return "/assets/products/horizontal-booster-pump-group.jpg";
  if (product.category?.includes("Bombas para agua")) return "/assets/products/electric-horizontal-split-end-suction-pump.png";
  if (product.driveType.includes("Diésel")) return "/assets/products/diesel-engine-fire-pump.png";
  return "/assets/products/electric-horizontal-split-end-suction-pump.png";
}

export function productImagePath(product: ChileProduct) {
  return imageBySourceSlug[product.sourceProductSlug || product.slug] || fallbackImage(product);
}

export function ProductImage({ product, priority = false, className = "" }: { product: ChileProduct; priority?: boolean; className?: string }) {
  return <Image className={className} src={productImagePath(product)} alt={`Producto GRIMM PUMP: ${product.name}`} fill={false} width={960} height={720} priority={priority} sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 33vw" />;
}
