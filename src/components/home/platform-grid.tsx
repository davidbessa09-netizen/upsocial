import Link from "next/link";
import { DynamicIcon } from "@/lib/icons";
import type { Platform } from "@/types/database";

export function PlatformGrid({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {platforms.map((platform) => (
        <Link
          key={platform.id}
          href={`/servicos/${platform.slug}`}
          className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg sm:p-5"
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-105"
            style={{ backgroundColor: platform.color }}
          >
            <DynamicIcon name={platform.icon} className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <span className="text-sm font-medium text-foreground">{platform.name}</span>
        </Link>
      ))}
    </div>
  );
}
