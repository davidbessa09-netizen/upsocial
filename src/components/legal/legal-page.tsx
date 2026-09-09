export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Última atualização: {updatedAt}</p>

      <div className="prose-legal mt-8 flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
