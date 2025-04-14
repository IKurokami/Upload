"use client";

import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const themes = [
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
    subThemes: [
      { key: "dark", label: "Dark", icon: Moon },
      { key: "onyx", label: "Onyx", icon: Moon },
      { key: "arcrylic", label: "Arcrylic", icon: Moon },
    ],
  },
];

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system";
  onChange?: (theme: "light" | "dark" | "system") => void;
  defaultValue?: "light" | "dark" | "system";
  className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [darkSubTheme, setDarkSubTheme] = useState<
    "dark" | "onyx" | "arcrylic"
  >(
    () =>
      ((typeof window !== "undefined" &&
        localStorage.getItem("darkSubTheme")) as
        | "dark"
        | "onyx"
        | "arcrylic") || "dark"
  );
  const [, setDarkMenuOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist dark sub-theme
  useEffect(() => {
    if (theme === "dark") {
      localStorage.setItem("darkSubTheme", darkSubTheme);
    }
  }, [darkSubTheme, theme]);

  useEffect(() => {
    if (theme !== "dark") {
      localStorage.removeItem("darkSubTheme");
    }
    setDarkMenuOpen(false);
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark" && darkSubTheme === "onyx") {
      html.classList.add("onyx");
    } else {
      html.classList.remove("onyx");
    }
  }, [theme, darkSubTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex h-9 rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {themes.map(({ key, icon: Icon, label, subThemes }) => {
        const isActive = theme === key;

        if (key === "dark") {
          return (
            <DropdownMenu key="dark">
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative h-7 w-7 rounded-full"
                  aria-label={label}
                  style={{
                    outline: isActive ? "2px solid var(--ring)" : undefined,
                  }}
                  onClick={() => setTheme("dark")}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTheme"
                      className="absolute inset-0 rounded-full bg-secondary"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative m-auto h-4 w-4",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dark Theme Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {subThemes?.map((sub) => (
                  <DropdownMenuItem
                    key={sub.key}
                    onClick={() => {
                      setTheme("dark");
                      setDarkSubTheme(sub.key as "dark" | "onyx" | "arcrylic");
                    }}
                    className={darkSubTheme === sub.key ? "font-bold" : ""}
                  >
                    <sub.icon className="mr-2 h-4 w-4" />
                    {sub.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <button
            type="button"
            key={key}
            className="relative h-7 w-7 rounded-full"
            onClick={() => setTheme(key as "light" | "dark" | "system")}
            aria-label={label}
          >
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 rounded-full bg-secondary"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <Icon
              className={cn(
                "relative m-auto h-4 w-4",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
