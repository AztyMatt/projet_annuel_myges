"use client";

import { useEffect, useState } from "react";
import { Send, Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type ConversationEntry = {
    id: string; // conversationId
    label: string;
    sublabel: string;
    color: string;
    initials: string;
};

type Message = { id: string; conversationId: string; senderId: string; content: string; createdAt: string };

type Me = { id: string; role: string };

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500"];

function initialsOf(label: string) {
    return label
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// La résolution nom/prénom à partir d'un userId n'existe pas côté backend (cf. CLAUDE.md section 10) :
// on affiche donc le contexte de la conversation (module, classe) plutôt qu'un nom de personne.
async function loadStudentConversations(): Promise<ConversationEntry[]> {
    const student = await api.get<{ id: string }>("/students/me");
    const [studentGroups, privates] = await Promise.all([
        api.get<{ groupId: string }[]>(`/student-groups/student/${student.id}`),
        api.get<{ conversationId: string }[]>(`/conversation-privates/student/${student.id}`),
    ]);

    const entries: ConversationEntry[] = [];

    for (const sg of studentGroups) {
        const group = await api.get<{ classId: string }>(`/groups/${sg.groupId}`);
        const [klass, courses] = await Promise.all([
            api.get<{ number: number; conversationId: string }>(`/classes/${group.classId}`),
            api.get<{ moduleId: string; conversationId: string }[]>(`/groups/${sg.groupId}/courses`),
        ]);

        entries.push({
            id: klass.conversationId,
            label: `Classe ${klass.number}`,
            sublabel: "Groupe de classe",
            color: "bg-emerald-500",
            initials: `C${klass.number}`,
        });

        for (const course of courses) {
            const courseModule = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            entries.push({
                id: course.conversationId,
                label: courseModule.name,
                sublabel: "Cours avec l'intervenant",
                color: "bg-blue-500",
                initials: initialsOf(courseModule.name),
            });
        }
    }

    privates.forEach((p) => {
        entries.push({
            id: p.conversationId,
            label: "Administration",
            sublabel: "Message privé",
            color: "bg-orange-500",
            initials: "AD",
        });
    });

    return entries;
}

async function loadInstructorConversations(): Promise<ConversationEntry[]> {
    const courses = await api.get<{ moduleId: string; conversationId: string }[]>("/courses/mine");
    const entries: ConversationEntry[] = [];
    for (const course of courses) {
        const courseModule = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
        entries.push({
            id: course.conversationId,
            label: courseModule.name,
            sublabel: "Cours",
            color: "bg-blue-500",
            initials: initialsOf(courseModule.name),
        });
    }
    return entries;
}

// Un ADMIN (non SUPER_ADMIN) n'a aujourd'hui aucun moyen de connaître son propre adminId
// (GET /admins/user/:userId est réservé à SUPER_ADMIN) : la messagerie ciblée est donc
// indisponible pour ce rôle tant que ce gap backend n'est pas comblé (voir CLAUDE.md section 10).
async function loadAdminConversations(userId: string): Promise<{ entries: ConversationEntry[]; limited: boolean }> {
    try {
        const admin = await api.get<{ id: string }>(`/admins/user/${userId}`);
        const privates = await api.get<{ id: string; studentId: string; conversationId: string }[]>(
            `/conversation-privates/admin/${admin.id}`,
        );
        return {
            entries: privates.map((p, i) => ({
                id: p.conversationId,
                label: `Étudiant #${p.studentId.slice(0, 8)}`,
                sublabel: "Message privé",
                color: COLORS[i % COLORS.length],
                initials: "ET",
            })),
            limited: false,
        };
    } catch {
        return { entries: [], limited: true };
    }
}

export default function Messagerie() {
    const [me, setMe] = useState<Me | null>(null);
    const [conversations, setConversations] = useState<ConversationEntry[]>([]);
    const [limitedRole, setLimitedRole] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesError, setMessagesError] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");

    const [showNewConversation, setShowNewConversation] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setLoadError("");
            try {
                const user = await api.get<Me>("/users/me");
                setMe(user);

                let entries: ConversationEntry[] = [];
                if (user.role === "STUDENT") entries = await loadStudentConversations();
                else if (user.role === "INSTRUCTOR") entries = await loadInstructorConversations();
                else {
                    const result = await loadAdminConversations(user.id);
                    entries = result.entries;
                    setLimitedRole(result.limited);
                }

                setConversations(entries);
                if (entries.length > 0) setActiveId(entries[0].id);
            } catch (error) {
                setLoadError(error instanceof ApiError ? error.message : "Impossible de charger vos conversations.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!activeId) return;
        setMessagesError("");
        api
            .get<Message[]>(`/messages/conversation/${activeId}`)
            .then((msgs) => {
                setMessages(msgs);
                // Marquage "lu" best-effort : on ne bloque pas l'affichage si ça échoue.
                if (me) {
                    msgs
                        .filter((m) => m.senderId !== me.id)
                        .forEach((m) => {
                            void api.post("/message-reads", { messageId: m.id, userId: me.id }).catch(() => {});
                        });
                }
            })
            .catch((error) => {
                setMessagesError(error instanceof ApiError ? error.message : "Impossible de charger les messages.");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    const handleSend = async () => {
        if (!draft.trim() || !activeId) return;
        setSending(true);
        try {
            const message = await api.post<Message>("/messages", { conversationId: activeId, content: draft.trim() });
            setMessages((prev) => [...prev, message]);
            setDraft("");
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
                                        <span className="font-semibold text-xs text-gray-900">{conv.label}</span>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">{conv.sublabel}</div>
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
                                            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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
                <NewConversationModal onClose={() => setShowNewConversation(false)} />
            )}
        </div>
    );
}

function NewConversationModal({ onClose }: { onClose: () => void }) {
    const [students, setStudents] = useState<{ id: string }[]>([]);
    const [studentId, setStudentId] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api
            .get<{ id: string }[]>("/students")
            .then(setStudents)
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les étudiants."));
    }, []);

    const handleCreate = async () => {
        if (!studentId) return;
        setSubmitting(true);
        setError("");
        try {
            const me = await api.get<{ id: string }>("/users/me");
            const admin = await api.get<{ id: string }>(`/admins/user/${me.id}`);
            const conversation = await api.post<{ id: string }>("/conversations", {});
            await api.post("/conversation-privates", {
                adminId: admin.id,
                studentId,
                conversationId: conversation.id,
            });
            onClose();
            window.location.reload();
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
                <p className="text-xs text-gray-500 mb-3">
                    Les noms d&apos;étudiants ne sont pas encore disponibles côté backend — sélection par identifiant.
                </p>
                <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none mb-4"
                >
                    <option value="">Choisir un étudiant…</option>
                    {students.map((s) => (
                        <option key={s.id} value={s.id}>
                            Étudiant #{s.id.slice(0, 8)}
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
                        disabled={!studentId || submitting}
                        className="flex-1 px-4 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
