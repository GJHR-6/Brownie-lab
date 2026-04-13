// ============================================================
// ARCHIVO DE CONFIGURACIÓN DE LA TIENDA
// Para replicar este sitio, solo cambia los valores aquí
// ============================================================

export const storeConfig = {
  // Información básica
  name: "Brownie Lab",
  tagline: "Horneado con amor, cada galleta cuenta",
  description:
    "Somos una pequeña tienda artesanal especializada en galletas y brownies hechos con los mejores ingredientes. Cada pieza es elaborada a mano con amor.",

  // Contacto y pedidos — CAMBIA EL NÚMERO DE WHATSAPP
  whatsapp: "5212345678901", // Formato: código país + número sin espacios

  // Moneda
  currency: "MXN",
  currencySymbol: "$",

  // Redes sociales — deja en blanco ("") si no aplica
  social: {
    instagram: "https://instagram.com/brownielab",
    facebook: "https://facebook.com/brownielab",
    tiktok: "",
  },

  // Colores de la marca (clases de Tailwind)
  theme: {
    primary: "amber-800",
    accent: "amber-500",
    bg: "amber-50",
  },
} as const;
