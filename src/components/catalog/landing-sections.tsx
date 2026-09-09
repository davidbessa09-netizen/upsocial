import Image from "next/image";
import { Check } from "lucide-react";

/**
 * Blocos de conteúdo editáveis pelo admin (product_landing_pages.sections,
 * jsonb). Cada bloco tem um "type"; tipos desconhecidos são ignorados
 * silenciosamente para nunca quebrar o render de uma LP mal formada.
 */
type Section =
  | { type: "text"; heading?: string; body: string }
  | { type: "features"; heading?: string; items: string[] }
  | { type: "image"; url: string; caption?: string };

function isSection(value: unknown): value is Section {
  return typeof value === "object" && value !== null && "type" in value;
}

export function LandingSections({ sections }: { sections: unknown[] }) {
  return (
    <div className="flex flex-col gap-10">
      {sections.filter(isSection).map((section, i) => {
        if (section.type === "text") {
          return (
            <div key={i}>
              {section.heading && <h2 className="text-xl font-semibold">{section.heading}</h2>}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          );
        }

        if (section.type === "features") {
          return (
            <div key={i}>
              {section.heading && <h2 className="text-xl font-semibold">{section.heading}</h2>}
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (section.type === "image") {
          return (
            <figure key={i}>
              <Image
                src={section.url}
                alt={section.caption ?? ""}
                width={800}
                height={450}
                className="w-full rounded-xl border border-border object-cover"
              />
              {section.caption && (
                <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                  {section.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}
