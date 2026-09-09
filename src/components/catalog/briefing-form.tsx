"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitBriefingAnswers } from "@/lib/briefing-actions";
import type { BriefingQuestion } from "@/types/database";

export function BriefingForm({
  orderId,
  orderNumber,
  questions,
}: {
  orderId: string;
  orderNumber: string;
  questions: BriefingQuestion[];
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    await submitBriefingAnswers(orderId, orderNumber, formData);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Briefing do projeto</h2>
        <p className="text-xs text-muted-foreground">
          Responda as perguntas abaixo para iniciarmos a produção do seu pedido.
        </p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-1.5">
          <Label htmlFor={`question_${q.id}`}>{q.question_text}</Label>
          {q.field_type === "textarea" ? (
            <textarea
              id={`question_${q.id}`}
              name={`question_${q.id}`}
              rows={3}
              required={q.required}
              className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            />
          ) : q.field_type === "select" ? (
            <select
              id={`question_${q.id}`}
              name={`question_${q.id}`}
              required={q.required}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {(q.options as string[] | null)?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`question_${q.id}`}
              name={`question_${q.id}`}
              type={q.field_type === "url" ? "url" : "text"}
              required={q.required}
            />
          )}
        </div>
      ))}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Enviando..." : "Enviar respostas"}
      </Button>
    </form>
  );
}
