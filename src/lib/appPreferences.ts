"use client";

import { useLocalStorage } from "./useLocalStorage";
import {
  CLIENT_TRACKING_MODE_KEY,
  ONBOARDING_COMPLETE_KEY,
} from "./storageKeys";

export { CLIENT_TRACKING_MODE_KEY, ONBOARDING_COMPLETE_KEY };

export type ClientTrackingMode = "clients" | "cars_only";

export function useAppPreferences() {
  const [onboardingComplete, setOnboardingComplete, onboardingReady] =
    useLocalStorage(ONBOARDING_COMPLETE_KEY, false);
  const [clientTrackingMode, setClientTrackingMode] =
    useLocalStorage<ClientTrackingMode>(CLIENT_TRACKING_MODE_KEY, "clients");

  return {
    onboardingComplete,
    setOnboardingComplete,
    clientTrackingMode,
    setClientTrackingMode,
    usesClients: clientTrackingMode === "clients",
    preferencesReady: onboardingReady,
  };
}
