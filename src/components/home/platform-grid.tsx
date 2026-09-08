import Link from "next/link";
import { getIcon } from "@/lib/icons";
import type { Platform } from "@/types/database";

export function PlatformGrid({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {platforms.map((platform) => {
        const Icon = getIcon(platform.icon);
        return (
          <Link
            key={platform.id}
            href={`/servicos/${platform.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-foreground">{platform.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
