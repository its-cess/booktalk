import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customColors = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "pear",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "bg-color": [{ bg: customColors }],
      "text-color": [{ text: customColors }],
      "border-color": [{ border: customColors }],
      "ring-color": [{ ring: customColors }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
