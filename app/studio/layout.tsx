import StudioSidebar from "@/components/layout/studio-sidebar";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-slate-200">
      {/* SIDEBAR (Fixed Left) */}
      <StudioSidebar />

      {/* MAIN CONTENT (Pushed Right) */}
      {/* Note: pl-20 matches the collapsed sidebar width */}
      <main className="flex-1 md:pl-20 transition-all duration-300 w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}