export const ONBOARDING_COMPLETE_KEY = "onboardingComplete";
export const CLIENT_TRACKING_MODE_KEY = "clientTrackingMode";
export const LOCALE_KEY = "locale";
export const THEME_KEY = "theme";
export const DASH_VIEW_MODE_KEY = "dashViewMode";
export const PLATE_VALIDATION_ENABLED_KEY = "plateValidationEnabled";
export const PLATE_FORMATS_KEY = "plateFormats";
export const LEGACY_PLATE_FORMAT_KEY = "plateFormat";

export const PORTABLE_LOCAL_STORAGE_KEYS = [
  ONBOARDING_COMPLETE_KEY,
  CLIENT_TRACKING_MODE_KEY,
  LOCALE_KEY,
  THEME_KEY,
  DASH_VIEW_MODE_KEY,
  PLATE_VALIDATION_ENABLED_KEY,
  PLATE_FORMATS_KEY,
  LEGACY_PLATE_FORMAT_KEY,
] as const;

export type PortableLocalStorageKey =
  (typeof PORTABLE_LOCAL_STORAGE_KEYS)[number];
