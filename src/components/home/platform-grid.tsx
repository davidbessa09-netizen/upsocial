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
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${platform.color}1a`, color: platform.color }}
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-foreground">{platform.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
