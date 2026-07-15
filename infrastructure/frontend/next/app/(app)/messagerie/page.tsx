"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

const POLL_INTERVAL_MS = 30000;

type ConversationKind = "class" | "course" | "private";

type ConversationSummary = {
    conversationId: string;
    kind: ConversationKind;
    title: string;
    subtitle: string;
    lastMessage: { content: string; senderId: string; createdAt: string } | null;
    unreadCount: number;
};

type ConversationEntry = {
    id: string; // conversationId
    label: string;
    sublabel: string;
    color: string;
    initials: string;
    lastMessage: { content: string; senderId: string; createdAt: string } | null;
    unreadCount: number;
};

type Message = { id: string; conversationId: string; senderId: string; content: string; createdAt: string };

type Me = { id: string; role: string };

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500"];

const senderNameCache = new Map<string, string>();

async function resolveSenderName(userId: string): Promise<string> {
    const cached = senderNameCache.get(userId);
    if (cached) return cached;
    const name = await api
        .get<{ firstname: string; lastname: string }>(`/users/${userId}`)
        .then((u) => `${u.firstname} ${u.lastname}`)
        .catch(() => `Utilisateur #${userId.slice(0, 8)}`);
    senderNameCache.set(userId, name);
    return name;
}

function initialsOf(label: string) {
    return label
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function colorFor(kind: ConversationKind, privateIndex: number) {
    if (kind === "class") return "bg-emerald-500";
    if (kind === "course") return "bg-blue-500";
    return COLORS[privateIndex % COLORS.length];
}

function toEntries(summaries: ConversationSummary[]): ConversationEntry[] {
    let privateIndex = 0;
    return summaries.map((s) => {
        const color = colorFor(s.kind, s.kind === "private" ? privateIndex++ : 0);
        return {
            id: s.conversationId,
            label: s.title,
            sublabel: s.subtitle,
            color,
            initials: initialsOf(s.title),
            lastMessage: s.lastMessage,
            unreadCount: s.unreadCount,
        };
    });
}

export default function Messagerie() {
    const [me, setMe] = useState<Me | null>(null);
    const [conversations, setConversations] = useState<ConversationEntry[]>([]);
    const [limitedRole, setLimitedRole] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [senderNames, setSenderNames] = useState<Record<string, string>>({});
    const [messagesError, setMessagesError] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");

    const [showNewConversation, setShowNewConversation] = useState(false);

    const messagesRef = useRef<Message[]>([]);
    const meRef = useRef<Me | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    useEffect(() => {
        meRef.current = me;
    }, [me]);

    const refreshConversations = async (opts: { silent?: boolean } = {}) => {
        try {
            const summaries = await api.get<ConversationSummary[]>("/conversations/mine");
            const entries = toEntries(summaries);
            setConversations(entries);
            if (!opts.silent) {
                if (entries.length > 0) setActiveId((prev) => prev ?? entries[0].id);
            }
        } catch (error) {
            if (!opts.silent) setLoadError(error instanceof ApiError ? error.message : "Impossible de charger vos conversations.");
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setLoadError("");
            try {
                const user = await api.get<Me>("/users/me");
                setMe(user);
                await refreshConversations();

                if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
                    await api
                        .get("/admins/me")
                        .then(() => setLimitedRole(false))
                        .catch(() => setLimitedRole(user.role === "ADMIN"));
                }
            } catch (error) {
                setLoadError(error instanceof ApiError ? error.message : "Impossible de charger vos conversations.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Rafraîchit la liste des conversations (dernier message + non-lus) toutes les 30s — même
    // décision d'équipe que le fil de la conversation active : pas de WebSocket, cf. CLAUDE.md.
    useEffect(() => {
        const interval = setInterval(() => void refreshConversations({ silent: true }), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async (conversationId: string, opts: { silent?: boolean } = {}) => {
        try {
            const msgs = await api.get<Message[]>(`/messages/conversation/${conversationId}`);
            const previousIds = new Set(messagesRef.current.map((m) => m.id));
            const newOnes = msgs.filter((m) => !previousIds.has(m.id));
            setMessages(msgs);
            if (!opts.silent) setMessagesError("");

            const currentMe = meRef.current;
            if (currentMe) {
                newOnes
                    .filter((m) => m.senderId !== currentMe.id)
                    .forEach((m) => {
                        void api.post("/message-reads", { messageId: m.id, userId: currentMe.id }).catch(() => {});
                    });
            }
            const uniqueSenderIds = [...new Set(newOnes.map((m) => m.senderId).filter((id) => id !== currentMe?.id))];
            if (uniqueSenderIds.length > 0) {
                const resolved = await Promise.all(uniqueSenderIds.map(async (id) => [id, await resolveSenderName(id)] as const));
                setSenderNames((prev) => ({ ...prev, ...Object.fromEntries(resolved) }));
            }
        } catch (error) {
            if (!opts.silent) {
                setMessagesError(error instanceof ApiError ? error.message : "Impossible de charger les messages.");
            }
        }
    };

    useEffect(() => {
        if (!activeId) return;
        void fetchMessages(activeId);
        // Ouvrir une conversation marque optimistiquement son badge à zéro — la prochaine
        // synchronisation de refreshConversations() confirmera depuis le backend.
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)));
        const interval = setInterval(() => void fetchMessages(activeId, { silent: true }), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [activeId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    const handleSend = async () => {
        if (!draft.trim() || !activeId) return;
        setSending(true);
        try {
            const message = await api.post<Message>("/messages", { conversationId: activeId, content: draft.trim() });
            setMessages((prev) => [...prev, message]);
            setDraft("");
            void refreshConversations({ silent: true });
        } catch (error) {
            setMessagesError(error instanceof ApiError ? error.message : "Envoi impossible.");
        } finally {
            setSending(false);
        }
    };

    const filtered = conversations.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));
    const active = conversations.find((c) => c.id === activeId) ?? null;
    const canStartConversation = (me?.role === "ADMIN" || me?.role === "SUPER_ADMIN") && !limitedRole;

    return (
        <div className="max-w-6xl">
            <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                style={{ height: "calc(100vh - 120px)" }}
            >
                <div className="flex h-full">
                    {/* Sidebar conversations */}
                    <div className="w-80 border-r border-gray-100 flex flex-col flex-shrink-0">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">Messages</h3>
                                {canStartConversation && (
                                    <button
                                        onClick={() => setShowNewConversation(true)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#001944] text-white hover:bg-[#002C6E] transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
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

                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {loading && <p className="p-4 text-xs text-gray-400">Chargement…</p>}
                            {loadError && <p className="p-4 text-xs text-red-600">{loadError}</p>}
                            {limitedRole && !loadError && (
                                <p className="p-4 text-xs text-orange-600">
                                    Messagerie ciblée indisponible pour votre rôle actuellement (limitation backend).
                                </p>
                            )}
                            {!loading && !loadError && filtered.length === 0 && (
                                <p className="p-4 text-xs text-gray-400">Aucune conversation.</p>
                            )}
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
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-xs text-gray-900 truncate">{conv.label}</span>
                                            {conv.unreadCount > 0 && (
                                                <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#001944] text-white text-[10px] font-bold flex items-center justify-center">
                                                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                            {conv.lastMessage ? conv.lastMessage.content : conv.sublabel}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="flex-1 flex flex-col">
                        {active ? (
                            <>
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
                                        <div className="font-bold text-sm text-gray-900">{active.label}</div>
                                        <div className="text-xs text-gray-500">{active.sublabel}</div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    {messagesError && <p className="text-xs text-red-600">{messagesError}</p>}
                                    {messages.map((msg) => {
                                        const isMine = msg.senderId === me?.id;
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                                                {!isMine && (
                                                    <span className="text-xs font-semibold text-gray-500 mb-0.5 px-1">
                                                        {senderNames[msg.senderId] ?? "…"}
                                                    </span>
                                                )}
                                                <div
                                                    className={cn(
                                                        "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm",
                                                        isMine
                                                            ? "bg-[#001944] text-white rounded-br-sm"
                                                            : "bg-gray-100 text-gray-800 rounded-bl-sm",
                                                    )}
                                                >
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                    <p className={cn("text-xs mt-1", isMine ? "text-white/60" : "text-gray-400")}>
                                                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {messages.length === 0 && !messagesError && (
                                        <p className="text-xs text-gray-400">Aucun message pour l&apos;instant.</p>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="px-5 py-4 border-t border-gray-100">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={draft}
                                                onChange={(e) => setDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        void handleSend();
                                                    }
                                                }}
                                                placeholder="Écrire un message… (Entrée pour envoyer)"
                                                rows={1}
                                                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                                                style={{ minHeight: "42px", maxHeight: "120px" }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => void handleSend()}
                                            disabled={sending || !draft.trim()}
                                            className={cn(
                                                "w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0",
                                                draft.trim()
                                                    ? "bg-[#001944] text-white hover:bg-[#002C6E]"
                                                    : "bg-gray-100 text-gray-400",
                                            )}
                                        >
                                            <Send size={15} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                                {loading ? "Chargement…" : "Sélectionnez une conversation"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showNewConversation && (
                <NewConversationModal
                    onClose={() => setShowNewConversation(false)}
                    onCreated={() => { setShowNewConversation(false); void refreshConversations(); }}
                />
            )}
        </div>
    );
}

function NewConversationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [students, setStudents] = useState<{ id: string; userId: string; label: string }[]>([]);
    const [studentUserId, setStudentUserId] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api
            .get<{ id: string; userId: string }[]>("/students")
            .then(async (list) => {
                const withLabels = await Promise.all(
                    list.map(async (s) => {
                        const user = await api
                            .get<{ firstname: string; lastname: string }>(`/users/${s.userId}`)
                            .catch(() => null);
                        return {
                            ...s,
                            label: user ? `${user.firstname} ${user.lastname}` : `Étudiant #${s.id.slice(0, 8)}`,
                        };
                    }),
                );
                setStudents(withLabels);
            })
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les étudiants."));
    }, []);

    const handleCreate = async () => {
        if (!studentUserId) return;
        setSubmitting(true);
        setError("");
        try {
            const me = await api.get<{ id: string }>("/users/me");
            await api.post("/conversation-privates", {
                userAId: me.id,
                userBId: studentUserId,
            });
            onCreated();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Création impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Nouvelle conversation</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </div>
                <select
                    value={studentUserId}
                    onChange={(e) => setStudentUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none mb-4"
                >
                    <option value="">Choisir un étudiant…</option>
                    {students.map((s) => (
                        <option key={s.id} value={s.userId}>
                            {s.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleCreate()}
                        disabled={!studentUserId || submitting}
                        className="flex-1 px-4 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
