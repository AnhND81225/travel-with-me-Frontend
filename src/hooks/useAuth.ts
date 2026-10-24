import { useState, useEffect, useCallback } from "react";
import { catalogApi, saveToken, Account, ApiError } from "../features/equipment/catalogApi";

const TOKEN_KEY = "treektour.catalog.token";

export interface AuthState {
  loading: boolean;
  account: Account | null;
  error: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    account: null,
    error: null,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    // 1. If URL contains token (e.g. from OAuth redirect like /admin?token=... or /passport?token=...)
    if (typeof window !== "undefined" && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token") || urlParams.get("accessToken");
      if (urlToken) {
        saveToken(urlToken);
        // Clean token parameter from URL without reload so browser history stays clean
        urlParams.delete("token");
        urlParams.delete("accessToken");
        const remainingQuery = urlParams.toString();
        const cleanUrl =
          window.location.pathname +
          (remainingQuery ? `?${remainingQuery}` : "") +
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({
        loading: false,
        account: null,
        error: null,
        isAuthenticated: false,
      });
      return null;
    }

    try {
      const account = await catalogApi<Account>("/users/me");
      if (account && account.status === "ACTIVE") {
        setState({
          loading: false,
          account,
          error: null,
          isAuthenticated: true,
        });
        return account;
      } else {
        saveToken(null);
        setState({
          loading: false,
          account: null,
          error: "Tài khoản bị tạm khóa hoặc không hoạt động.",
          isAuthenticated: false,
        });
        return null;
      }
    } catch (err: unknown) {
      // Check if it's a demo session token when backend is offline
      if (token.startsWith("demo-")) {
        const demoRole = token.includes("admin")
          ? "ADMIN"
          : token.includes("staff")
          ? "STAFF"
          : "CUSTOMER";
        const demoAccount: Account = {
          id: 999,
          fullName:
            demoRole === "ADMIN"
              ? "Administrator (HQ)"
              : demoRole === "STAFF"
              ? "Ranger Sa Pa (Staff)"
              : "Climber Explorer",
          role: demoRole,
          status: "ACTIVE",
        };
        setState({
          loading: false,
          account: demoAccount,
          error: null,
          isAuthenticated: true,
        });
        return demoAccount;
      }

      if (err instanceof ApiError && [401, 403].includes(err.status)) {
        saveToken(null);
      }
      setState({
        loading: false,
        account: null,
        error: err instanceof Error ? err.message : "Phiên đăng nhập hết hạn.",
        isAuthenticated: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(() => {
    saveToken(null);
    setState({
      loading: false,
      account: null,
      error: null,
      isAuthenticated: false,
    });
    window.location.assign("/login");
  }, []);

  return {
    ...state,
    checkAuth,
    logout,
  };
}
