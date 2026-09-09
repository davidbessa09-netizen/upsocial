import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <div className="max-w-2xl px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Novo produto</h1>
      <div className="mt-6">
        <ProductForm action={createProduct} />
      </div>
    </div>
  );
}
