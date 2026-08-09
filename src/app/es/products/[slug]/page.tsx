import { notFound, permanentRedirect } from "next/navigation";
const redirects: Record<string, string> = { "edj-fire-pump-set": "sistema-bomba-incendio-edj", "diesel-jockey-pump-set": "bomba-diesel-contra-incendio", "electric-jockey-pump-set": "bomba-electrica-contra-incendio", "long-shaft-fire-pump": "bomba-incendio-eje-largo" };
export default async function LegacyProductRedirect({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const target = redirects[slug]; if (!target) notFound(); permanentRedirect(`/es/productos/${target}`); }
