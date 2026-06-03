"use client";

import { TrendingUp, Award, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Module = {
    name: string;
    type: "ACADÉMIQUE" | "ENTREPRISE";
    coef: number;
    grades: { label: string; value: number; date: string }[];
    average: number;
    mention: string;
};

const modules: Module[] = [
    {
        name: "Architecture logicielle",
        type: "ACADÉMIQUE",
        coef: 3,
        grades: [
            { label: "Examen final", value: 16, date: "15/03/2026" },
            { label: "TP noté", value: 14.5, date: "01/03/2026" },
            { label: "Projet", value: 17, date: "20/02/2026" },
        ],
        average: 15.8,
        mention: "TB",
    },
    {
        name: "Sécurité applicative",
        type: "ACADÉMIQUE",
        coef: 3,
        grades: [
            { label: "Examen final", value: 16, date: "10/03/2026" },
            { label: "CTF / TP", value: 18, date: "25/02/2026" },
        ],
        average: 17,
        mention: "TB",
    },
    {
        name: "Bases de données avancées",
        type: "ACADÉMIQUE",
        coef: 2,
        grades: [
            { label: "QCM", value: 13, date: "05/03/2026" },
            { label: "Projet SQL", value: 15, date: "10/02/2026" },
        ],
        average: 14,
        mention: "B",
    },
    {
        name: "Gestion de projet",
        type: "ACADÉMIQUE",
        coef: 1,
        grades: [{ label: "Dossier", value: 12, date: "01/04/2026" }],
        average: 12,
        mention: "P",
    },
    {
        name: "React & TypeScript",
        type: "ACADÉMIQUE",
        coef: 2,
        grades: [
            { label: "Projet final", value: 17, date: "20/03/2026" },
            { label: "Code review", value: 16.5, date: "01/03/2026" },
        ],
        average: 16.75,
        mention: "TB",
    },
    {
        name: "Évaluation entreprise S1",
        type: "ENTREPRISE",
        coef: 4,
        grades: [
            { label: "Note tuteur", value: 16, date: "31/01/2026" },
            { label: "Rapport alternance", value: 15, date: "15/01/2026" },
        ],
        average: 15.5,
        mention: "TB",
    },
];

const mentionConfig: Record<string, { label: string; className: string }> = {
    TB: { label: "Très Bien", className: "bg-green-100 text-green-700" },
    B: { label: "Bien", className: "bg-blue-100 text-blue-700" },
    AB: { label: "Assez Bien", className: "bg-sky-100 text-sky-700" },
    P: { label: "Passable", className: "bg-gray-100 text-gray-700" },
    F: { label: "Insuffisant", className: "bg-red-100 text-red-700" },
};

function calcGPA(): number {
    const weighted = modules.reduce((acc, m) => acc + m.average * m.coef, 0);
    const totalCoef = modules.reduce((acc, m) => acc + m.coef, 0);
    return Math.round((weighted / totalCoef) * 10) / 10;
}

export default function NotesEtudiant() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const gpa = calcGPA();
    const academic = modules.filter((m) => m.type === "ACADÉMIQUE");
    const enterprise = modules.filter((m) => m.type === "ENTREPRISE");

    return (
        <div className="space-y-6 max-w-4xl">
            {/* KPI */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                        <TrendingUp size={18} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{gpa}/20</div>
                    <div className="text-xs text-gray-500 mt-0.5">Moyenne générale</div>
                    <div className="text-xs text-green-600 font-medium mt-1.5">+0.3 vs semestre dernier</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                        <Award size={18} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">180</div>
                    <div className="text-xs text-gray-500 mt-0.5">ECTS validés / 240</div>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "75%" }} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                        <BookOpen size={18} className="text-orange-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">15.5/20</div>
                    <div className="text-xs text-gray-500 mt-0.5">Appréciation entreprise</div>
                    <div className="text-xs text-orange-600 font-medium mt-1.5">Note tuteur + rapport</div>
                </div>
            </div>

            {/* Modules académiques */}
            <div>
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-3">Modules académiques</h3>
                <div className="space-y-2">
                    {academic.map((mod) => (
                        <ModuleCard
                            key={mod.name}
                            module={mod}
                            expanded={expanded === mod.name}
                            onToggle={() => setExpanded(expanded === mod.name ? null : mod.name)}
                        />
                    ))}
                </div>
            </div>

            {/* Modules entreprise */}
            <div>
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-3">
                    Évaluations entreprise
                </h3>
                <div className="space-y-2">
                    {enterprise.map((mod) => (
                        <ModuleCard
                            key={mod.name}
                            module={mod}
                            expanded={expanded === mod.name}
                            onToggle={() => setExpanded(expanded === mod.name ? null : mod.name)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ModuleCard({ module, expanded, onToggle }: { module: Module; expanded: boolean; onToggle: () => void }) {
    const mention = mentionConfig[module.mention];
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{module.name}</span>
                        <span
                            className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded",
                                module.type === "ENTREPRISE"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-50 text-blue-600",
                            )}
                        >
                            {module.type}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Coefficient {module.coef}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-black text-gray-900 text-base">{module.average}/20</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg", mention.className)}>
                        {module.mention}
                    </span>
                    {expanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {module.grades.map((g, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-2.5">
                            <div>
                                <span className="text-sm text-gray-700 font-medium">{g.label}</span>
                                <span className="text-xs text-gray-400 ml-3">{g.date}</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{g.value}/20</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
