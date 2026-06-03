"use client";

import {
    Users,
    BookOpen,
    Upload,
    Clock,
    ChevronRight,
    FileUp,
    MapPin,
    Monitor,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stats = [
    { label: "Cours aujourd'hui", value: "3", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Rendus en attente", value: "12", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Étudiants actifs", value: "87", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Modules actifs", value: "4", icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
];

const todayCourses = [
    {
        time: "09:00–11:00",
        title: "Architecture logicielle",
        class: "5IW – 27 étudiants",
        room: "Salle 201",
        type: "presentiel",
    },
    {
        time: "11:00–13:00",
        title: "Design Patterns avancés",
        class: "5IW – 24 étudiants",
        room: "Distanciel",
        type: "distanciel",
    },
    {
        time: "14:00–16:00",
        title: "TP – Microservices",
        class: "5NIDS – 22 étudiants",
        room: "Salle TP 3",
        type: "presentiel",
    },
];

const modules = [
    { name: "Architecture logicielle", students: 27, rendus: 18, total: 20, progress: 90 },
    { name: "Design Patterns", students: 24, rendus: 10, total: 24, progress: 42 },
    { name: "TP Microservices", students: 22, rendus: 22, total: 22, progress: 100 },
    { name: "Cloud & DevOps", students: 30, rendus: 5, total: 30, progress: 17 },
];

const messages = [
    { from: "Lucas Martin", text: "Question sur le TP microservices", time: "Il y a 10 min", unread: true },
    { from: "Emma Durand", text: "Peut-on utiliser Kotlin pour le rendu ?", time: "Il y a 1h", unread: true },
    { from: "Thomas Leclerc", text: "Merci pour la correction !", time: "Hier", unread: false },
];

export default function DashboardIntervenant() {
    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Bonjour, Sophie 👋</h2>
                <p className="text-gray-500 text-sm mt-1">
                    {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                                <Icon size={18} className={s.color} />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Today's courses */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-500" />
                                <h3 className="font-bold text-gray-900 text-sm">Cours du jour</h3>
                            </div>
                            <Link
                                href="/intervenant/planning"
                                className="text-xs text-blue-600 flex items-center gap-1 font-medium"
                            >
                                Planning complet <ChevronRight size={12} />
                            </Link>
                        </div>
                        <div className="p-5 space-y-3">
                            {todayCourses.map((c, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="text-right w-24 flex-shrink-0">
                                        <div className="text-xs font-bold text-gray-700">{c.time}</div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-1 h-10 rounded-full flex-shrink-0",
                                            c.type === "distanciel" ? "bg-purple-500" : "bg-blue-500",
                                        )}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-gray-900">{c.title}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                            <Users size={11} />
                                            <span>{c.class}</span>
                                            <span>·</span>
                                            {c.type === "distanciel" ? <Monitor size={11} /> : <MapPin size={11} />}
                                            <span>{c.room}</span>
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                                            c.type === "distanciel"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700",
                                        )}
                                    >
                                        {c.type === "distanciel" ? "Distanciel" : "Présentiel"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modules & submissions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-gray-500" />
                                <h3 className="font-bold text-gray-900 text-sm">Modules actifs — Rendus</h3>
                            </div>
                            <Link
                                href="/intervenant/supports"
                                className="text-xs text-blue-600 flex items-center gap-1 font-medium"
                            >
                                Supports <ChevronRight size={12} />
                            </Link>
                        </div>
                        <div className="p-5 space-y-4">
                            {modules.map((m, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                                            <span className="text-xs text-gray-400 ml-2">{m.students} étudiants</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            {m.progress === 100 ? (
                                                <CheckCircle size={13} className="text-green-500" />
                                            ) : (
                                                <span className="text-gray-500">
                                                    {m.rendus}/{m.total}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={cn(
                                                "h-1.5 rounded-full",
                                                m.progress === 100
                                                    ? "bg-green-500"
                                                    : m.progress > 50
                                                      ? "bg-blue-500"
                                                      : "bg-orange-400",
                                            )}
                                            style={{ width: `${m.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Upload zone */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Upload size={16} className="text-gray-500" />
                                <h3 className="font-bold text-gray-900 text-sm">Déposer un support</h3>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                                <FileUp size={24} className="text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-600">Glisser-déposer un fichier</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, PPT, ZIP — max 50 Mo</p>
                                <button className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                    Parcourir
                                </button>
                            </div>
                            <Link
                                href="/intervenant/supports"
                                className="flex items-center justify-center gap-1.5 mt-3 text-xs text-blue-600 font-medium hover:underline"
                            >
                                Gérer tous les supports <ChevronRight size={12} />
                            </Link>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-50">
                            <h3 className="font-bold text-gray-900 text-sm">Messages récents</h3>
                            <Link href="/messagerie" className="text-xs text-blue-600 font-medium">
                                Tout voir
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {m.from
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-gray-800">{m.from}</span>
                                            {m.unread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{m.text}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{m.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
