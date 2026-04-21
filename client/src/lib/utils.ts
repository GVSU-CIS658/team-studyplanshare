import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWelcomeName(value?: string | null) {
  const firstPart = value
    ?.trim()
    .split(/[._\s]/)
    .find(Boolean);
  if (!firstPart) return null;

  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
}
