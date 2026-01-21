import { createInstance } from "i18next";

import { defaultLocale, namespaces, type Locale, type Namespace } from "./config";
import { resources } from "./resources";

export async function getI18n(locale: Locale = defaultLocale) {
  const i18n = createInstance();
  await i18n.init({
    lng: locale,
    fallbackLng: defaultLocale,
    resources,
    ns: namespaces,
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    }
  });
  return i18n;
}

export async function getT(
  locale: Locale = defaultLocale,
  namespace: Namespace = "common"
) {
  const i18n = await getI18n(locale);
  return i18n.getFixedT(locale, namespace);
}
