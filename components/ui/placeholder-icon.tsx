interface PlaceholderIconProps {
    className?: string
    size?: number
}

export function PlaceholderIcon({ className = "", size = 40 }: PlaceholderIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="20" cy="20" r="20" className="fill-muted" />

            {/* Chart bars */}
            <rect
                x="10"
                y="22"
                width="4"
                height="8"
                rx="1"
                className="fill-muted-foreground/40"
            />
            <rect
                x="16"
                y="16"
                width="4"
                height="14"
                rx="1"
                className="fill-muted-foreground/60"
            />
            <rect
                x="22"
                y="12"
                width="4"
                height="18"
                rx="1"
                className="fill-primary/80"
            />
            <rect
                x="28"
                y="18"
                width="4"
                height="12"
                rx="1"
                className="fill-muted-foreground/50"
            />
        </svg>
    )
}
