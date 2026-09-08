"use client";

import { Headset } from "lucide-react";

/** Placeholder: abre o ticket de suporte quando /suporte existir. Por ora, mailto. */
export function SupportFab() {
  return (
    <a
      href="mailto:suporte@upsocial.com"
      aria-label="Falar com o suporte"
      className="fixed right-4 bottom-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 md:right-6 md:bottom-6"
    >
      <Headset className="h-5 w-5" />
    </a>
  );
}
