import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { NewCompanyModal } from "@/components/companies/NewCompanyModal";

export const metadata: Metadata = {
  title: "Signal Stack — Company Intelligence & Executive Briefing Engine",
  description: "Autonomous, evidence-backed company intelligence, founder calibration, source stack monitoring, and Monday Morning Briefings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden flex bg-slate-50 font-sans text-slate-900">
        <Providers>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <TopNavbar />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </main>
          </div>
          <NewCompanyModal />
        </Providers>
      </body>
    </html>
  );
}
