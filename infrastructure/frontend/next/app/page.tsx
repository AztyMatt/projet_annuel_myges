import Link from "next/link";
import {
    GraduationCap,
    Presentation,
    Building2,
    ShieldCheck,
    CalendarClock,
    ClipboardCheck,
    FolderOpen,
    MessageSquare,
    KeyRound,
    Bell,
} from "lucide-react";

const roles = [
    {
        icon: GraduationCap,
        name: "Étudiant",
        description: "Planning, notes, absences, documents et supports de cours en un seul endroit.",
    },
    {
        icon: Presentation,
        name: "Intervenant",
        description: "Saisie des notes, dépôt de supports, création et suivi des évaluations.",
    },
    {
        icon: Building2,
        name: "Administration",
        description: "Gestion des dossiers étudiants, validation des absences et des documents, planning.",
    },
    {
        icon: ShieldCheck,
        name: "Super administrateur",
        description: "Attribution des rôles, gestion des comptes, audit et traçabilité.",
    },
];

const features = [
    { icon: CalendarClock, title: "Planning", description: "Emploi du temps par semaine, présentiel ou distanciel, mis à jour en direct." },
    { icon: ClipboardCheck, title: "Notes & évaluations", description: "Saisie par les intervenants, moyennes pondérées, gel avant jury." },
    { icon: FolderOpen, title: "Documents & absences", description: "Dépôt de justificatifs, dossier administratif centralisé, suivi des contrats." },
    { icon: MessageSquare, title: "Messagerie", description: "Discussions par classe, par cours, ou en privé avec l'administration." },
    { icon: KeyRound, title: "Sécurité", description: "Double authentification, mots de passe forts, export et suppression RGPD." },
    { icon: Bell, title: "Notifications", description: "Alerté dès qu'une note, une absence ou un message vous concerne." },
];

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero */}
            <div
                className="px-4 pt-14 pb-20"
                style={{
                    background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)",
                }}
            >
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 backdrop-blur-sm bg-white/10 border border-white/20">
                        <span className="text-2xl font-black text-white">M</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">MYGES 2.0</h1>
                    <p className="text-white/70 mt-3 max-w-xl mx-auto">
                        La plateforme de gestion scolaire : planning, notes, absences, documents et messagerie,
                        chacun dans son espace selon son rôle.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <Link
                            href="/login"
                            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-[#001944] bg-white hover:bg-white/90 transition-all shadow-sm"
                        >
                            Se connecter
                        </Link>
                        <Link
                            href="/signup"
                            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white border border-white/30 hover:bg-white/10 transition-all"
                        >
                            Créer un compte
                        </Link>
                    </div>
                </div>
            </div>

            {/* Fonctionnalités */}
            <div className="flex-1 bg-white px-4 py-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-xs font-bold text-[#002C6E] uppercase tracking-wider text-center mb-2">
                        Fonctionnalités
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-10">
                        Tout ce qu'il faut pour suivre une scolarité, du planning à la messagerie.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="flex items-start gap-3 p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#002C6E] shrink-0">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{title}</div>
                                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rôles */}
            <div className="bg-gray-50 px-4 py-16 border-t border-gray-100">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-xs font-bold text-[#002C6E] uppercase tracking-wider text-center mb-2">
                        Un espace pour chaque rôle
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-10">
                        4 rôles, 4 espaces dédiés, un même accès sécurisé.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {roles.map(({ icon: Icon, name, description }) => (
                            <div key={name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#001944] text-white shrink-0">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{name}</div>
                                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-4 py-8" style={{ backgroundColor: "#001944" }}>
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-xs">MyGES 2.0 — Projet Annuel ESGI 5IW</p>
                    <nav className="flex items-center gap-5 text-xs text-white/60">
                        <Link href="/mentions-legales" className="hover:text-white transition-colors">
                            Mentions légales
                        </Link>
                        <Link href="/cgu" className="hover:text-white transition-colors">
                            CGU
                        </Link>
                        <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
                            Confidentialité &amp; cookies
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
