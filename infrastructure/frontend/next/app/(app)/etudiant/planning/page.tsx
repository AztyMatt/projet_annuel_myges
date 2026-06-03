"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Monitor, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

type CourseType = "presentiel" | "distanciel" | "entreprise";

type Course = {
    day: number;
    startHour: number;
    duration: number;
    title: string;
    teacher: string;
    room: string;
    type: CourseType;
};

const weekCourses: Course[] = [
    {
        day: 0,
        startHour: 9,
        duration: 2,
        title: "Architecture logicielle",
        teacher: "M. Dupont",
        room: "Salle 201",
        type: "presentiel",
    },
    {
        day: 0,
        startHour: 11,
        duration: 2,
        title: "Bases de données avancées",
        teacher: "Mme. Martin",
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 0,
        startHour: 14,
        duration: 2,
        title: "DevOps & CI/CD",
        teacher: "M. Bernard",
        room: "Salle 105",
        type: "presentiel",
    },
    {
        day: 1,
        startHour: 8,
        duration: 4,
        title: "Journée entreprise",
        teacher: "—",
        room: "Entreprise",
        type: "entreprise",
    },
    {
        day: 1,
        startHour: 14,
        duration: 2,
        title: "React avancé",
        teacher: "Mme. Leclerc",
        room: "Salle 301",
        type: "presentiel",
    },
    {
        day: 2,
        startHour: 9,
        duration: 3,
        title: "Sécurité applicative",
        teacher: "M. Roux",
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 2,
        startHour: 14,
        duration: 2,
        title: "Gestion de projet",
        teacher: "M. Petit",
        room: "Salle 202",
        type: "presentiel",
    },
    {
        day: 3,
        startHour: 8,
        duration: 10,
        title: "Journée entreprise",
        teacher: "—",
        room: "Entreprise",
        type: "entreprise",
    },
    {
        day: 4,
        startHour: 9,
        duration: 2,
        title: "Cloud & Kubernetes",
        teacher: "M. Bernard",
        room: "Salle 105",
        type: "presentiel",
    },
    {
        day: 4,
        startHour: 11,
        duration: 2,
        title: "UX Design",
        teacher: "Mme. Simon",
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 4,
        startHour: 14,
        duration: 2,
        title: "TP – Microservices",
        teacher: "M. Dupont",
        room: "Salle TP 3",
        type: "presentiel",
    },
];

const typeConfig = {
    presentiel: {
        label: "Présentiel",
        bg: "bg-blue-100 border-blue-300",
        text: "text-blue-800",
        icon: MapPin,
        filter: "bg-blue-500",
    },
    distanciel: {
        label: "Distanciel",
        bg: "bg-purple-100 border-purple-300",
        text: "text-purple-800",
        icon: Monitor,
        filter: "bg-purple-500",
    },
    entreprise: {
        label: "Entreprise",
        bg: "bg-orange-100 border-orange-300",
        text: "text-orange-800",
        icon: Building2,
        filter: "bg-orange-500",
    },
};

function getWeekLabel(offset: number): string {
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(now.getDate() + diff + offset * 7);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${fmt(monday)} – ${fmt(friday)}`;
}

export default function PlanningEtudiant() {
    const [weekOffset, setWeekOffset] = useState(0);
    const [filters, setFilters] = useState<Record<CourseType, boolean>>({
        presentiel: true,
        distanciel: true,
        entreprise: true,
    });

    const toggleFilter = (type: CourseType) => setFilters((f) => ({ ...f, [type]: !f[type] }));

    const visibleCourses = weekCourses.filter((c) => filters[c.type]);

    const GRID_START = 8;
    const GRID_ROWS = HOURS.length;
    const ROW_HEIGHT = 56;

    return (
        <div className="space-y-5 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mon planning</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{getWeekLabel(weekOffset)}</p>
                </div>

                {/* Week navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekOffset((w) => w - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setWeekOffset(0)}
                        className="px-3 h-8 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Aujourd'hui
                    </button>
                    <button
                        onClick={() => setWeekOffset((w) => w + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Afficher :</span>
                {(Object.entries(typeConfig) as [CourseType, typeof typeConfig.presentiel][]).map(([type, cfg]) => (
                    <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            filters[type]
                                ? cn("text-white border-transparent", cfg.filter)
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300",
                        )}
                    >
                        {cfg.label}
                    </button>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Day headers */}
                <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                    <div className="border-r border-gray-100" />
                    {DAYS.map((day) => (
                        <div key={day} className="text-center py-3 border-r border-gray-100 last:border-r-0">
                            <span className="text-sm font-semibold text-gray-700">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Time grid */}
                <div
                    className="relative grid"
                    style={{
                        gridTemplateColumns: "56px repeat(5, 1fr)",
                        height: `${GRID_ROWS * ROW_HEIGHT}px`,
                    }}
                >
                    {/* Time labels column */}
                    <div className="border-r border-gray-100">
                        {HOURS.map((h) => (
                            <div
                                key={h}
                                className="border-b border-gray-50 flex items-start justify-end pr-2 pt-1"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                <span className="text-xs text-gray-400 font-mono">{h}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns with background grid */}
                    {DAYS.map((_, dayIndex) => (
                        <div key={dayIndex} className="relative border-r border-gray-100 last:border-r-0">
                            {HOURS.map((_, hi) => (
                                <div
                                    key={hi}
                                    className="border-b border-gray-50"
                                    style={{ height: `${ROW_HEIGHT}px` }}
                                />
                            ))}
                            {/* Course blocks */}
                            {visibleCourses
                                .filter((c) => c.day === dayIndex)
                                .map((course, ci) => {
                                    const cfg = typeConfig[course.type];
                                    const Icon = cfg.icon;
                                    const top = (course.startHour - GRID_START) * ROW_HEIGHT;
                                    const height = course.duration * ROW_HEIGHT - 4;
                                    return (
                                        <div
                                            key={ci}
                                            className={cn(
                                                "absolute left-1 right-1 rounded-lg border px-2 py-1.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                                                cfg.bg,
                                            )}
                                            style={{ top: top + 2, height }}
                                        >
                                            <div
                                                className={cn("text-xs font-semibold leading-tight truncate", cfg.text)}
                                            >
                                                {course.title}
                                            </div>
                                            {height > 60 && (
                                                <>
                                                    <div className={cn("text-xs mt-0.5 truncate opacity-70", cfg.text)}>
                                                        {course.teacher}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1 text-xs mt-0.5 opacity-60",
                                                            cfg.text,
                                                        )}
                                                    >
                                                        <Icon size={10} />
                                                        {course.room}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-medium">Légende :</span>
                {(Object.entries(typeConfig) as [CourseType, typeof typeConfig.presentiel][]).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded-sm border", cfg.bg)} />
                        <span>{cfg.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
