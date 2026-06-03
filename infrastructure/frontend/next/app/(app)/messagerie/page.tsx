"use client";

import { useState } from "react";
import { Send, Search, Plus, X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

type Conversation = {
    id: number;
    name: string;
    role: string;
    initials: string;
    color: string;
    lastMessage: string;
    time: string;
    unread: number;
    messages: { from: "me" | "them"; text: string; time: string }[];
};

const conversations: Conversation[] = [
    {
        id: 1,
        name: "M. Dupont",
        role: "Intervenant – Architecture",
        initials: "MD",
        color: "bg-blue-500",
        lastMessage: "N'oubliez pas le rendu TP2 vendredi !",
        time: "Il y a 10 min",
        unread: 2,
        messages: [
            { from: "them", text: "Bonjour Lucas, votre TP1 a été corrigé.", time: "08:30" },
            { from: "me", text: "Merci ! J'ai une question sur l'exercice 3, le pattern Repository.", time: "08:45" },
            {
                from: "them",
                text: "Bien sûr, le Repository isole la couche de persistance. Consultez le slide 12 du CM2.",
                time: "09:00",
            },
            { from: "me", text: "Parfait, c'est plus clair maintenant. Merci !", time: "09:05" },
            { from: "them", text: "N'oubliez pas le rendu TP2 vendredi !", time: "09:10" },
        ],
    },
    {
        id: 2,
        name: "Administration Scolarité",
        role: "Service scolarité",
        initials: "AS",
        color: "bg-orange-500",
        lastMessage: "Votre justificatif a été validé.",
        time: "Hier",
        unread: 0,
        messages: [
            {
                from: "them",
                text: "Bonjour, nous avons bien reçu votre justificatif d'absence du 15/04.",
                time: "14:00",
            },
            { from: "me", text: "Merci pour la confirmation.", time: "14:30" },
            { from: "them", text: "Votre justificatif a été validé.", time: "15:00" },
        ],
    },
    {
        id: 3,
        name: "Mme. Martin",
        role: "Intervenant – Base de données",
        initials: "MM",
        color: "bg-purple-500",
        lastMessage: "Les notes du QCM sont disponibles.",
        time: "Il y a 2j",
        unread: 1,
        messages: [
            { from: "them", text: "Les notes du QCM sont disponibles dans l'espace notes.", time: "10:00" },
            { from: "me", text: "Merci Madame, j'irai les consulter.", time: "10:15" },
        ],
    },
    {
        id: 4,
        name: "Classe 5IW",
        role: "Groupe de classe",
        initials: "5I",
        color: "bg-emerald-500",
        lastMessage: "Quelqu'un a le corrigé du TP1 ?",
        time: "Il y a 3j",
        unread: 5,
        messages: [
            { from: "them", text: "Quelqu'un a le corrigé du TP1 ?", time: "16:30" },
            { from: "me", text: "Le prof a dit qu'il le mettra en ligne vendredi.", time: "16:35" },
            { from: "them", text: "Ok merci !", time: "16:36" },
        ],
    },
];

export default function Messagerie() {
    const [activeId, setActiveId] = useState<number>(1);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");

    const active = conversations.find((c) => c.id === activeId)!;
    const filtered = conversations.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSend = () => {
        if (!message.trim()) return;
        setMessage("");
    };

    return (
        <div className="max-w-6xl">
            <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                style={{ height: "calc(100vh - 120px)" }}
            >
                <div className="flex h-full">
                    {/* Sidebar conversations */}
                    <div className="w-80 border-r border-gray-100 flex flex-col flex-shrink-0">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">Messages</h3>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#001944] text-white hover:bg-[#002C6E] transition-colors">
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {filtered.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveId(conv.id)}
                                    className={cn(
                                        "w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                                        activeId === conv.id && "bg-blue-50 hover:bg-blue-50",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                                            conv.color,
                                        )}
                                    >
                                        {conv.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-xs text-gray-900">{conv.name}</span>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                                {conv.time}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">{conv.role}</div>
                                        <div className="text-xs text-gray-600 truncate mt-0.5">{conv.lastMessage}</div>
                                    </div>
                                    {conv.unread > 0 && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-white text-xs font-bold">{conv.unread}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="flex-1 flex flex-col">
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                                    active.color,
                                )}
                            >
                                {active.initials}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-gray-900">{active.name}</div>
                                <div className="text-xs text-gray-500">{active.role}</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {active.messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}
                                >
                                    <div
                                        className={cn(
                                            "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm",
                                            msg.from === "me"
                                                ? "bg-[#001944] text-white rounded-br-sm"
                                                : "bg-gray-100 text-gray-800 rounded-bl-sm",
                                        )}
                                    >
                                        <p className="leading-relaxed">{msg.text}</p>
                                        <p
                                            className={cn(
                                                "text-xs mt-1",
                                                msg.from === "me" ? "text-white/60" : "text-gray-400",
                                            )}
                                        >
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-5 py-4 border-t border-gray-100">
                            <div className="flex items-end gap-2">
                                <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0">
                                    <Paperclip size={16} />
                                </button>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Écrire un message… (Entrée pour envoyer)"
                                        rows={1}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                                        style={{ minHeight: "42px", maxHeight: "120px" }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    className={cn(
                                        "w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0",
                                        message.trim()
                                            ? "bg-[#001944] text-white hover:bg-[#002C6E]"
                                            : "bg-gray-100 text-gray-400",
                                    )}
                                >
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
