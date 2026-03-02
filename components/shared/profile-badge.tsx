import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ShieldCheck,
    Code2,
    Cpu,
    Crown,
    type LucideIcon
} from "lucide-react";

export type ProfileRole = "moderator" | "developer" | "system" | "vip";

interface RoleConfig {
    label: string;
    icon: LucideIcon;
    variantClasses: string;
    iconContainerClasses: string;
    iconClasses: string;
}

const roleConfigs: Record<ProfileRole, RoleConfig> = {
    moderator: {
        label: "Moderador",
        icon: ShieldCheck,
        variantClasses: "bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
        iconContainerClasses: "bg-blue-100/50 dark:bg-blue-800/30",
        iconClasses: "text-blue-600 dark:text-blue-400",
    },
    developer: {
        label: "Developer",
        icon: Code2,
        variantClasses: "bg-amber-50/50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
        iconContainerClasses: "bg-amber-100/50 dark:bg-amber-800/30",
        iconClasses: "text-amber-600 dark:text-amber-400",
    },
    system: {
        label: "System",
        icon: Cpu,
        variantClasses: "bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
        iconContainerClasses: "bg-emerald-100/50 dark:bg-emerald-800/30",
        iconClasses: "text-emerald-600 dark:text-emerald-400",
    },
    vip: {
        label: "VIP",
        icon: Crown,
        variantClasses: "bg-yellow-50/50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30",
        iconContainerClasses: "bg-yellow-100/50 dark:bg-yellow-800/20",
        iconClasses: "text-yellow-600 dark:text-yellow-400",
    },
};

interface ProfileBadgeProps {
    role: ProfileRole;
    className?: string;
    showIcon?: boolean;
}

export function ProfileBadge({ role, className, showIcon = true }: ProfileBadgeProps) {
    const config = roleConfigs[role];

    if (!config) return null;

    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                "pl-1 pr-3 py-1 h-7 rounded-full font-medium transition-colors border shadow-none",
                config.variantClasses,
                className
            )}
        >
            {showIcon && (
                <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full mr-2",
                    config.iconContainerClasses
                )}>
                    <Icon className={cn("h-3 w-3", config.iconClasses)} />
                </div>
            )}
            {config.label}
        </Badge>
    );
}
