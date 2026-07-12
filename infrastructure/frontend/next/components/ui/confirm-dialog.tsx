"use client";

import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    pendingLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    pendingLabel = "Traitement…",
    destructive = true,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={() => !loading && onCancel()}
        >
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{description}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50",
                            destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#001944] text-white hover:bg-[#002C6E]",
                        )}
                    >
                        {loading ? pendingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
