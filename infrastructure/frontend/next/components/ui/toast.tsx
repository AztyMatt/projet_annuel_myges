"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";
type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
    success: (message: string) => void;
    error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantClasses: Record<ToastVariant, string> = {
    success: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
};

const variantIcon: Record<ToastVariant, React.ElementType> = {
    success: CheckCircle,
    error: XCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const show = useCallback((message: string, variant: ToastVariant) => {
        const id = ++nextId.current;
        setToasts((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const value: ToastContextValue = {
        success: (message: string) => show(message, "success"),
        error: (message: string) => show(message, "error"),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => {
                    const Icon = variantIcon[t.variant];
                    return (
                        <div
                            key={t.id}
                            className={cn(
                                "flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border",
                                variantClasses[t.variant],
                            )}
                        >
                            <Icon size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{t.message}</span>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
