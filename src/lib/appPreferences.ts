"use client";

import { useLocalStorage } from "./useLocalStorage";

export const ONBOARDING_COMPLETE_KEY = "onboardingComplete";
export const CLIENT_TRACKING_MODE_KEY = "clientTrackingMode";

export type ClientTrackingMode = "clients" | "cars_only";

export function useAppPreferences() {
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage(
    ONBOARDING_COMPLETE_KEY,
    false,
  );
  const [clientTrackingMode, setClientTrackingMode] =
    useLocalStorage<ClientTrackingMode>(CLIENT_TRACKING_MODE_KEY, "clients");

  return {
    onboardingComplete,
    setOnboardingComplete,
    clientTrackingMode,
    setClientTrackingMode,
    usesClients: clientTrackingMode === "clients",
  };
}
