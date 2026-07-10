export type Product = { slug: string; name: string; category: string; description: string; specs: [string, string][] };

export const products: Product[] = [
  { slug: "edj-fire-pump-set", name: "Conjunto EDJ", category: "Paquetes contra incendio", description: "Configuración eléctrica, diésel y jockey para continuidad de operación.", specs: [["Caudal", "5–400 L/s"], ["Altura", "3–15 bar"], ["Diámetro", "65–250 mm"]] },
  { slug: "diesel-jockey-pump-set", name: "Bomba diésel + jockey", category: "Paquetes contra incendio", description: "Solución de respaldo autónomo para condiciones de proyecto exigentes.", specs: [["Caudal", "5–400 L/s"], ["Altura", "3–15 bar"], ["Presión", "0.3–1.5 MPa"]] },
  { slug: "electric-jockey-pump-set", name: "Conjunto eléctrico + jockey", category: "Paquetes contra incendio", description: "Paquete para infraestructura con alimentación eléctrica definida.", specs: [["Caudal", "5–400 L/s"], ["Altura", "3–15 bar"], ["Velocidad", "740–2900 r/min"]] },
  { slug: "long-shaft-fire-pump", name: "Bombas de eje largo", category: "Bombas contra incendio", description: "Opciones eléctricas y diésel para condiciones de toma de agua especiales.", specs: [["Caudal", "0–200 m³/h"], ["Altura", "0–200 m"], ["Frecuencia", "50/60 Hz"]] },
];
