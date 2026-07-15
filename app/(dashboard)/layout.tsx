import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const teacher = await getCurrentTeacher();

  return (
    <div className="min-h-screen bg-[#f3f7ff]">
      <AppSidebar teacher={teacher} />
      <div className="min-h-screen lg:pl-[260px] print:pl-0">
        <MobileHeader teacher={teacher} />
        {children}
        <MobileNavigation />
      </div>
    </div>
  );
}
