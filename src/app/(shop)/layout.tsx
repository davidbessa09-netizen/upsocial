import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SupportFab } from "@/components/layout/support-fab";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 flex-1">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
      <SupportFab />
    </>
  );
}
