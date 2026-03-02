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
        variantClasses: "bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-md",
        iconContainerClasses: "bg-blue-500/20",
        iconClasses: "text-blue-500",
    },
    developer: {
        label: "Developer",
        icon: Code2,
        variantClasses: "bg-orange-500/10 text-orange-500 border-orange-500/20 backdrop-blur-md",
        iconContainerClasses: "bg-orange-500/20",
        iconClasses: "text-orange-500",
    },
    system: {
        label: "System",
        icon: Cpu,
        variantClasses: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 backdrop-blur-md",
        iconContainerClasses: "bg-emerald-500/20",
        iconClasses: "text-emerald-500",
    },
    vip: {
        label: "VIP",
        icon: Crown,
        variantClasses: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-md",
        iconContainerClasses: "bg-yellow-500/20",
        iconClasses: "text-yellow-500",
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
                "pl-2 pr-3 py-1 h-7 rounded-full font-bold tracking-tight transition-all border shadow-none select-none",
                config.variantClasses,
                className
            )}
        >
            {showIcon && (
                <Icon className={cn("h-3.5 w-3.5 mr-1 shrink-0", config.iconClasses)} />
            )}
            <span className="text-[11px] uppercase">{config.label}</span>
        </Badge>
    );
}
