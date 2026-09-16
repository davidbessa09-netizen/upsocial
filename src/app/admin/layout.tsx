import { requireStaff } from "@/lib/admin/guard";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();

  return (
    <div className="dark flex min-h-screen flex-1 bg-background text-foreground">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
