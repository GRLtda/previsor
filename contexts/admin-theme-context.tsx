"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminTheme = "light" | "dark";

interface AdminThemeContextValue {
  theme: AdminTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const STORAGE_KEY = "previzor-admin-theme";

const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(undefined);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  const setTheme = (nextTheme: AdminTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme]
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={mounted && theme === "dark" ? "dark" : undefined}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }

  return context;
}
