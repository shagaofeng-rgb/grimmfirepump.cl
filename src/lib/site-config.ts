export const siteConfig = {
  companyName: "GRIMM PUMP",
  legalCompanyName: "Grimm Water Treatment (Zhejiang) Co., Ltd.",
  email: "Cain@grimmfirepump.com",
  whatsapp: "+86 181 0161 6808",
  whatsappUrl: "https://wa.me/8618101616808",
  address: "No.2, Weilong Road, Nianli Town, Qujiang District, Quzhou City, Zhejiang Province",
  defaultLocale: "es",
  supportedLocales: ["es", "pt", "en"] as const,
};

export type Locale = (typeof siteConfig.supportedLocales)[number];
