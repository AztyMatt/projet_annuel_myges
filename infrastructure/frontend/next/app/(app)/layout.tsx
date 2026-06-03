import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <TopBar />
            <main className="ml-64 pt-16 min-h-screen">
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
