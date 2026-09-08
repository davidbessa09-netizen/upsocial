/** Formata um valor em centavos como moeda BRL (ex: 3990 -> "R$ 39,90"). */
export function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
