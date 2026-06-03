"use client";

import { useState } from "react";
import { Lock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const promotions = ["5IW", "5NIDS", "5TWIN"];

const modules = [
    {
        name: "Architecture logicielle",
        teacher: "M. Dupont",
        coef: 3,
        avg: 14.2,
        min: 8,
        max: 18,
        filled: 26,
        total: 27,
        frozen: false,
    },
    {
        name: "Sécurité applicative",
        teacher: "M. Roux",
        coef: 3,
        avg: 15.1,
        min: 10,
        max: 19,
        filled: 27,
        total: 27,
        frozen: true,
    },
    {
        name: "Bases de données",
        teacher: "Mme. Martin",
        coef: 2,
        avg: 13.4,
        min: 7,
        max: 17,
        filled: 20,
        total: 27,
        frozen: false,
    },
    {
        name: "Gestion de projet",
        teacher: "M. Petit",
        coef: 1,
        avg: 12.8,
        min: 9,
        max: 16,
        filled: 27,
        total: 27,
        frozen: true,
    },
    {
        name: "React & TypeScript",
        teacher: "Mme. Leclerc",
        coef: 2,
        avg: 15.9,
        min: 11,
        max: 20,
        filled: 25,
        total: 27,
        frozen: false,
    },
    {
        name: "Cloud & DevOps",
        teacher: "M. Bernard",
        coef: 3,
        avg: 0,
        min: 0,
        max: 0,
        filled: 0,
        total: 27,
        frozen: false,
    },
];

export default function NotesScolarite() {
    const [promo, setPromo] = useState("5IW");
    const frozen = modules.filter((m) => m.frozen).length;
    const complete = modules.filter((m) => m.filled === m.total && m.filled > 0).length;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* KPI */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                        <TrendingUp size={18} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                        {modules.filter((m) => m.filled > 0).length}/{modules.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Modules avec notes</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                        <CheckCircle size={18} className="text-green-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{complete}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Modules complets</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                        <Lock size={18} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{frozen}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Notes gelées (jury)</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 p-5 border-b border-gray-50">
                    {promotions.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPromo(p)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                promo === p ? "bg-[#001944] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {[
                                    "Module",
                                    "Intervenant",
                                    "Coef.",
                                    "Moy.",
                                    "Min / Max",
                                    "Saisie",
                                    "Statut",
                                    "Action",
                                ].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {modules.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{m.name}</td>
                                    <td className="px-5 py-3 text-gray-500 text-xs">{m.teacher}</td>
                                    <td className="px-5 py-3 text-gray-700">{m.coef}</td>
                                    <td className="px-5 py-3 font-bold text-gray-900">
                                        {m.avg > 0 ? `${m.avg}/20` : "—"}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-gray-500">
                                        {m.min > 0 ? `${m.min} / ${m.max}` : "—"}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className={cn(
                                                        "h-1.5 rounded-full",
                                                        m.filled === m.total && m.filled > 0
                                                            ? "bg-green-500"
                                                            : m.filled > 0
                                                              ? "bg-blue-500"
                                                              : "bg-gray-200",
                                                    )}
                                                    style={{ width: `${(m.filled / m.total) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {m.filled}/{m.total}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {m.frozen ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-purple-600">
                                                <Lock size={11} /> Gelé
                                            </span>
                                        ) : m.filled === m.total && m.filled > 0 ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                                <CheckCircle size={11} /> Complet
                                            </span>
                                        ) : m.filled > 0 ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                                                <AlertCircle size={11} /> En cours
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">En attente</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        {!m.frozen && m.filled === m.total && m.filled > 0 && (
                                            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200">
                                                <Lock size={11} /> Geler
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
