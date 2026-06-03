"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, MapPin, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type CourseType = "presentiel" | "distanciel";

type Course = {
    day: number;
    startHour: number;
    duration: number;
    title: string;
    class: string;
    students: number;
    room: string;
    type: CourseType;
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const myCourses: Course[] = [
    {
        day: 0,
        startHour: 9,
        duration: 2,
        title: "Architecture logicielle",
        class: "5IW",
        students: 27,
        room: "Salle 201",
        type: "presentiel",
    },
    {
        day: 0,
        startHour: 11,
        duration: 2,
        title: "Design Patterns",
        class: "5IW",
        students: 27,
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 0,
        startHour: 14,
        duration: 2,
        title: "TP – Microservices",
        class: "5NIDS",
        students: 22,
        room: "Salle TP 3",
        type: "presentiel",
    },
    {
        day: 1,
        startHour: 9,
        duration: 4,
        title: "Architecture logicielle",
        class: "5TWIN",
        students: 24,
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 1,
        startHour: 14,
        duration: 2,
        title: "Design Patterns avancés",
        class: "5IW",
        students: 27,
        room: "Salle 301",
        type: "presentiel",
    },
    {
        day: 2,
        startHour: 9,
        duration: 3,
        title: "TP – Architecture",
        class: "5IW",
        students: 27,
        room: "Salle TP 1",
        type: "presentiel",
    },
    {
        day: 3,
        startHour: 10,
        duration: 2,
        title: "Cloud & Kubernetes",
        class: "5NIDS",
        students: 22,
        room: "Distanciel",
        type: "distanciel",
    },
    {
        day: 3,
        startHour: 14,
        duration: 2,
        title: "TP – Kubernetes",
        class: "5NIDS",
        students: 22,
        room: "Salle TP 2",
        type: "presentiel",
    },
    {
        day: 4,
        startHour: 9,
        duration: 2,
        title: "Architecture logicielle",
        class: "5IW",
        students: 27,
        room: "Salle 201",
        type: "presentiel",
    },
    {
        day: 4,
        startHour: 14,
        duration: 2,
        title: "Soutenance TP",
        class: "5IW",
        students: 27,
        room: "Amphi B",
        type: "presentiel",
    },
];

const typeConfig = {
    presentiel: {
        bg: "bg-emerald-100 border-emerald-300",
        text: "text-emerald-800",
        dot: "bg-emerald-500",
        label: "Présentiel",
        icon: MapPin,
    },
    distanciel: {
        bg: "bg-purple-100 border-purple-300",
        text: "text-purple-800",
        dot: "bg-purple-500",
        label: "Distanciel",
        icon: Monitor,
    },
};

function getWeekLabel(offset: number): string {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `Semaine du ${fmt(monday)} au ${fmt(friday)}`;
}

export default function PlanningIntervenant() {
    const [weekOffset, setWeekOffset] = useState(0);

    const totalHours = myCourses.reduce((acc, c) => acc + c.duration, 0);
    const GRID_START = 8;
    const ROW_HEIGHT = 56;

    return (
        <div className="space-y-5 max-w-7xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mon planning</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{getWeekLabel(weekOffset)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100 text-sm">
                        <span className="font-bold text-emerald-600">{totalHours}h</span>
                        <span className="text-gray-500 ml-1">cette semaine</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset((w) => w - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="px-3 h-8 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            Cette semaine
                        </button>
                        <button
                            onClick={() => setWeekOffset((w) => w + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                {(Object.entries(typeConfig) as [CourseType, typeof typeConfig.presentiel][]).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded-sm border", cfg.bg)} />
                        <span>{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                    <div className="border-r border-gray-100" />
                    {DAYS.map((day) => (
                        <div key={day} className="text-center py-3 border-r border-gray-100 last:border-r-0">
                            <span className="text-sm font-semibold text-gray-700">{day}</span>
                        </div>
                    ))}
                </div>

                <div
                    className="relative grid"
                    style={{ gridTemplateColumns: "56px repeat(5, 1fr)", height: `${HOURS.length * ROW_HEIGHT}px` }}
                >
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

                    {DAYS.map((_, dayIndex) => (
                        <div key={dayIndex} className="relative border-r border-gray-100 last:border-r-0">
                            {HOURS.map((_, hi) => (
                                <div
                                    key={hi}
                                    className="border-b border-gray-50"
                                    style={{ height: `${ROW_HEIGHT}px` }}
                                />
                            ))}
                            {myCourses
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
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1 text-xs mt-0.5 opacity-70",
                                                            cfg.text,
                                                        )}
                                                    >
                                                        <Users size={10} />
                                                        {course.class} · {course.students} étudiants
                                                    </div>
                                                    {height > 90 && (
                                                        <div
                                                            className={cn(
                                                                "flex items-center gap-1 text-xs mt-0.5 opacity-60",
                                                                cfg.text,
                                                            )}
                                                        >
                                                            <Icon size={10} />
                                                            {course.room}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
