import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nb", "en"],
  defaultLocale: "nb",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
