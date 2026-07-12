import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "green" | "emerald" | "red" | "orange" | "blue" | "purple" | "gray";

const toneClasses: Record<StatusTone, string> = {
    green: "bg-green-100 text-green-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-600",
};

type StatusBadgeProps = {
    tone: StatusTone;
    icon?: React.ElementType;
    children: ReactNode;
    className?: string;
};

export function StatusBadge({ tone, icon: Icon, children, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium",
                toneClasses[tone],
                className,
            )}
        >
            {Icon && <Icon size={11} />}
            {children}
        </span>
    );
}
