"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

      // In a real app, you would point this to your Cloudflare Worker URL
      // const workerUrl = "https://micro-auto-backend.your-username.workers.dev"
      // const res = await fetch(`${workerUrl}${endpoint}`, { ... })
      // const data = await res.json()
      // if (!res.ok) throw new Error(data.error)
      // const token = data.token;

      // Mocking for now since we don't have the worker deployed:
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const token = "mock_jwt_token_" + Date.now();

      await db.syncMetadata.put({
        id: "default",
        lastSyncTimestamp: 0,
        userToken: token,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || t("authenticationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-zinc-100">
          {isRegistering ? t("createAccount") : t("cloudSyncLogin")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {isRegistering ? t("signUpDesc") : t("logInDesc")}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              {t("email")}
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              {t("password")}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-slate-700 dark:text-slate-300 font-medium"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading
                ? isRegistering
                  ? t("creatingAccount")
                  : t("loggingIn")
                : isRegistering
                  ? t("signUp")
                  : t("logIn")}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isRegistering ? t("alreadyHaveAccount") : t("dontHaveAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
