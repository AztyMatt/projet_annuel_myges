"use client";

import {
    BookOpen,
    Calendar,
    Clock,
    AlertCircle,
    TrendingUp,
    FileText,
    Award,
    ChevronRight,
    MapPin,
    Monitor,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stats = [
    {
        label: "Moyenne générale",
        value: "14.5",
        unit: "/20",
        icon: TrendingUp,
        color: "text-blue-600",
        bg: "bg-blue-50",
        change: "+0.3 ce semestre",
        changeColor: "text-green-600",
    },
    {
        label: "ECTS validés",
        value: "180",
        unit: "/240",
        icon: Award,
        color: "text-purple-600",
        bg: "bg-purple-50",
        change: "75% de progression",
        changeColor: "text-purple-600",
    },
    {
        label: "Absences",
        value: "3",
        unit: "/ semestre",
        icon: AlertCircle,
        color: "text-orange-600",
        bg: "bg-orange-50",
        change: "2 justifiées",
        changeColor: "text-gray-500",
    },
    {
        label: "Prochain examen",
        value: "5",
        unit: "jours",
        icon: Calendar,
        color: "text-red-600",
        bg: "bg-red-50",
        change: "Architecture logicielle",
        changeColor: "text-gray-500",
    },
];

const todayCourses = [
    {
        time: "09:00",
        end: "11:00",
        title: "Architecture logicielle",
        teacher: "M. Dupont",
        room: "Salle 201",
        type: "presentiel",
    },
    {
        time: "11:00",
        end: "13:00",
        title: "Bases de données avancées",
        teacher: "Mme. Martin",
        room: "Distanciel",
        type: "distanciel",
    },
    {
        time: "14:00",
        end: "16:00",
        title: "DevOps & CI/CD",
        teacher: "M. Bernard",
        room: "Salle 105",
        type: "presentiel",
    },
    {
        time: "16:00",
        end: "18:00",
        title: "Journée entreprise",
        teacher: "—",
        room: "Entreprise",
        type: "entreprise",
    },
];

const recentGrades = [
    { module: "Sécurité applicative", grade: 16, coef: 3, mention: "TB" },
    { module: "Architecture microservices", grade: 13.5, coef: 2, mention: "AB" },
    { module: "React avancé", grade: 17, coef: 2, mention: "TB" },
    { module: "Gestion de projet", grade: 12, coef: 1, mention: "P" },
];

const typeConfig = {
    presentiel: { label: "Présentiel", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    distanciel: { label: "Distanciel", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
    entreprise: { label: "Entreprise", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

const mentionConfig = {
    TB: "bg-green-100 text-green-700",
    B: "bg-blue-100 text-blue-700",
    AB: "bg-sky-100 text-sky-700",
    P: "bg-gray-100 text-gray-700",
    F: "bg-red-100 text-red-700",
};

export default function DashboardEtudiant() {
    const today = new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Bonjour, Lucas 👋</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                    <Icon size={18} className={stat.color} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                                <span className="text-sm text-gray-500 font-medium">{stat.unit}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                            <div className={cn("text-xs font-medium mt-2", stat.changeColor)}>{stat.change}</div>
                        </div>
                    );
                })}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Today's schedule */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between p-5 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-500" />
                            <h3 className="font-bold text-gray-900 text-sm">Planning du jour</h3>
                        </div>
                        <Link
                            href="/etudiant/planning"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                            Voir tout <ChevronRight size={12} />
                        </Link>
                    </div>
                    <div className="p-5 space-y-3">
                        {todayCourses.map((course, i) => {
                            const type = typeConfig[course.type as keyof typeof typeConfig];
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="text-right w-14 flex-shrink-0">
                                        <div className="text-xs font-bold text-gray-700">{course.time}</div>
                                        <div className="text-xs text-gray-400">{course.end}</div>
                                    </div>
                                    <div className={cn("w-1 h-10 rounded-full flex-shrink-0", type.dot)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-gray-900 truncate">
                                            {course.title}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                            <span>{course.teacher}</span>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                {course.type === "distanciel" ? (
                                                    <Monitor size={11} />
                                                ) : (
                                                    <MapPin size={11} />
                                                )}
                                                {course.room}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                                            type.color,
                                        )}
                                    >
                                        {type.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent grades */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between p-5 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-gray-500" />
                            <h3 className="font-bold text-gray-900 text-sm">Dernières notes</h3>
                        </div>
                        <Link
                            href="/etudiant/notes"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                            Tout voir <ChevronRight size={12} />
                        </Link>
                    </div>
                    <div className="p-5 space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate">{g.module}</div>
                                    <div className="text-xs text-gray-400">Coef. {g.coef}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="font-bold text-gray-900 text-sm">{g.grade}/20</span>
                                    <span
                                        className={cn(
                                            "text-xs font-bold px-1.5 py-0.5 rounded",
                                            mentionConfig[g.mention as keyof typeof mentionConfig],
                                        )}
                                    >
                                        {g.mention}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ECTS progress */}
                    <div className="px-5 pb-5 pt-1">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                                <span>Progression ECTS</span>
                                <span>180 / 240</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "75%" }} />
                            </div>
                            <div className="text-xs text-purple-600 font-medium mt-1.5">75% complétés</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: "Mon planning",
                        href: "/etudiant/planning",
                        icon: Calendar,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                    },
                    {
                        label: "Mes notes",
                        href: "/etudiant/notes",
                        icon: BookOpen,
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                    },
                    {
                        label: "Mes absences",
                        href: "/etudiant/absences",
                        icon: AlertCircle,
                        color: "text-orange-600",
                        bg: "bg-orange-50",
                    },
                    {
                        label: "Mes documents",
                        href: "/etudiant/documents",
                        icon: FileText,
                        color: "text-green-600",
                        bg: "bg-green-50",
                    },
                ].map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", link.bg)}>
                                <Icon size={16} className={link.color} />
                            </div>
                            <span className="font-medium text-sm text-gray-800 group-hover:text-gray-900">
                                {link.label}
                            </span>
                            <ChevronRight size={14} className="text-gray-400 ml-auto" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
