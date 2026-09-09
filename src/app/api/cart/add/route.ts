import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToCart } from "@/lib/cart";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

  const body = await request.json();
  if (!body.productId || !body.packageId || !body.customerInput?.trim()) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  try {
    await addToCart(user.id, {
      productId: body.productId,
      packageId: body.packageId,
      customerInput: body.customerInput.trim(),
      quantity: body.quantity ?? 1,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível adicionar ao carrinho." },
      { status: 500 },
    );
  }
}
