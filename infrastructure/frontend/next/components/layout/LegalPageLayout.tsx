import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="px-4 py-5" style={{ backgroundColor: "#001944" }}>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
                        <ArrowLeft size={16} />
                        Retour à l&apos;accueil
                    </Link>
                    <span className="text-white font-black text-sm tracking-tight">MYGES 2.0</span>
                </div>
            </header>

            <main className="flex-1 bg-white px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-black text-gray-900 mb-8">{title}</h1>
                    <div className="space-y-6 text-sm text-gray-600 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="px-4 py-6" style={{ backgroundColor: "#001944" }}>
                <p className="text-center text-white/40 text-xs">MyGES 2.0 — Projet Annuel ESGI 5IW</p>
            </footer>
        </div>
    );
}
