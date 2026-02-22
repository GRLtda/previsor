import { icons, type LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
    name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
    // Try to find the icon dynamically, fallback to HelpCircle if not found
    const LucideIcon = (icons as unknown as Record<string, React.FC<LucideProps>>)[name] || icons.HelpCircle;

    return <LucideIcon {...props} />;
}
