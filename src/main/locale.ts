import {
  DEFAULT_ACTIVE_LOCALE,
  getLocale as getSharedLocale,
  setLocale as setSharedLocale,
  type AppLocale,
} from "../shared/i18n";

export function getAppLocale(): AppLocale {
  return getSharedLocale() || DEFAULT_ACTIVE_LOCALE;
}

export async function setAppLocale(locale: AppLocale): Promise<AppLocale> {
  return setSharedLocale(locale);
}
