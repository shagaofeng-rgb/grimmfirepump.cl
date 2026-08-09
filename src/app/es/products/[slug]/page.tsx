import { notFound, permanentRedirect } from "next/navigation";
const redirects: Record<string, string> = { "edj-fire-pump-set": "sistema-incendio-edj", "diesel-jockey-pump-set": "conjunto-diesel-jockey", "electric-jockey-pump-set": "conjunto-electrico-jockey", "long-shaft-fire-pump": "bomba-incendio-eje-largo-electrica" };
export default async function LegacyProductRedirect({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const target = redirects[slug]; if (!target) notFound(); permanentRedirect(`/es/productos/${target}`); }
