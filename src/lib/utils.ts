export const clsx = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Assuming using tailwind-merge (twMerge) would be ideal,
// using simple join for simplicity unless specified
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(...inputs));
}
