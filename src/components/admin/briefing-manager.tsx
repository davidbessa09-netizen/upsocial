import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ensureBriefingFormAction, createBriefingQuestion, deleteBriefingQuestion } from "@/lib/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const FIELD_TYPES = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "select", label: "Seleção (opções)" },
  { value: "file", label: "Arquivo" },
  { value: "url", label: "Link" },
];

export async function BriefingManager({ productId }: { productId: string }) {
  const admin = createAdminClient();

  const { data: form } = await admin.from("briefing_forms").select("*").eq("product_id", productId).maybeSingle();
  const questions = form
    ? (await admin.from("briefing_questions").select("*").eq("briefing_form_id", form.id).order("display_order")).data
    : [];

  if (!form) {
    return (
      <form action={ensureBriefingFormAction.bind(null, productId)}>
        <Button type="submit" size="sm" variant="outline">
          Criar formulário de briefing
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {(questions ?? []).map((q) => (
        <div key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
          <div>
            <p className="text-sm font-medium">{q.question_text}</p>
            <p className="text-xs text-muted-foreground">
              {FIELD_TYPES.find((f) => f.value === q.field_type)?.label}
              {q.required ? " · obrigatório" : ""}
            </p>
          </div>
          <form action={deleteBriefingQuestion.bind(null, productId, q.id)}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
              Remover
            </button>
          </form>
        </div>
      ))}

      <details className="rounded-xl border border-dashed border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Nova pergunta</summary>
        <div className="border-t border-border p-4">
          <form action={createBriefingQuestion.bind(null, productId, form.id)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Pergunta</Label>
              <Input name="question_text" placeholder="Qual o nome do seu negócio?" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de campo</Label>
                <select name="field_type" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  {FIELD_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Opções (só para &quot;seleção&quot;, separadas por vírgula)</Label>
                <Input name="options" placeholder="Opção 1, Opção 2" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="required" defaultChecked className="h-4 w-4" />
              Obrigatória
            </label>
            <Button type="submit" size="sm" className="w-fit">
              Adicionar pergunta
            </Button>
          </form>
        </div>
      </details>
    </div>
  );
}
