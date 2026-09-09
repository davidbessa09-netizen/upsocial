import { Button } from "@/components/ui/button";
import { uploadDigitalFile, deleteDigitalFile } from "@/lib/admin/actions";
import type { DigitalFile } from "@/types/database";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export function DigitalFilesManager({ productId, files }: { productId: string; files: DigitalFile[] }) {
  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5"
        >
          <div>
            <p className="text-sm font-medium">{file.file_name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.file_size_bytes)}</p>
          </div>
          <form action={deleteDigitalFile.bind(null, productId, file.id)}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
              Remover
            </button>
          </form>
        </div>
      ))}

      {files.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo anexado ainda.</p>}

      <form action={uploadDigitalFile.bind(null, productId)} className="flex items-center gap-3">
        <input
          type="file"
          name="file"
          required
          className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
        />
        <Button type="submit" size="sm">
          Enviar arquivo
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Máx. 50 MB por arquivo. O arquivo fica em um bucket privado — o cliente nunca acessa a URL direta, só via
        download assinado depois da compra aprovada.
      </p>
    </div>
  );
}
