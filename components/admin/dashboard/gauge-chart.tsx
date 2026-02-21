"use client";

import { cn } from "@/lib/utils";

interface GaugeChartProps {
    value: number; // 0–100
    label?: string;
    size?: number;
    className?: string;
}

export function GaugeChart({
    value,
    label = "Saúde",
    size = 200,
    className,
}: GaugeChartProps) {
    const clampedValue = Math.max(0, Math.min(100, value));

    // SVG geometry for semicircle
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2 + 10;

    // Arc from 180° (left) to 0° (right), semicircle
    const startAngle = 180;
    const endAngle = 0;
    const totalArc = 180;
    const circumference = Math.PI * radius;

    // Calculate the dash offset for the value arc
    const valueArc = (clampedValue / 100) * circumference;

    // Convert angle to position for needle
    const needleAngle = startAngle - (clampedValue / 100) * totalArc;
    const needleRadians = (needleAngle * Math.PI) / 180;
    const needleLength = radius - 20;
    const needleX = cx + needleLength * Math.cos(needleRadians);
    const needleY = cy - needleLength * Math.sin(needleRadians);

    // Color based on value
    const getColor = (v: number) => {
        if (v >= 75) return { main: "#22c55e", glow: "rgba(34, 197, 94, 0.3)" };
        if (v >= 50) return { main: "#eab308", glow: "rgba(234, 179, 8, 0.3)" };
        if (v >= 25) return { main: "#f97316", glow: "rgba(249, 115, 22, 0.3)" };
        return { main: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" };
    };

    const color = getColor(clampedValue);

    // Status text
    const getStatus = (v: number) => {
        if (v >= 80) return "Excelente";
        if (v >= 60) return "Bom";
        if (v >= 40) return "Regular";
        if (v >= 20) return "Atenção";
        return "Crítico";
    };

    // Arc path (semicircle from left to right)
    const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <svg
                width={size}
                height={size / 2 + 40}
                viewBox={`0 0 ${size} ${size / 2 + 40}`}
                className="drop-shadow-sm"
            >
                <defs>
                    {/* Gradient for the value arc */}
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="33%" stopColor="#f97316" />
                        <stop offset="66%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="gaugeGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background track */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Value arc */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={circumference - valueArc}
                    style={{
                        transition: "stroke-dashoffset 1s ease-out",
                    }}
                    filter="url(#gaugeGlow)"
                />

                {/* Scale marks */}
                {[0, 25, 50, 75, 100].map((tick) => {
                    const tickAngle = startAngle - (tick / 100) * totalArc;
                    const tickRadians = (tickAngle * Math.PI) / 180;
                    const innerR = radius + strokeWidth / 2 + 4;
                    const outerR = innerR + 8;
                    const x1 = cx + innerR * Math.cos(tickRadians);
                    const y1 = cy - innerR * Math.sin(tickRadians);
                    const x2 = cx + outerR * Math.cos(tickRadians);
                    const y2 = cy - outerR * Math.sin(tickRadians);
                    return (
                        <line
                            key={tick}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            opacity={0.3}
                        />
                    );
                })}

                {/* Needle */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={needleX}
                    y2={needleY}
                    stroke={color.main}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{
                        transition: "all 1s ease-out",
                        filter: `drop-shadow(0 0 4px ${color.glow})`,
                    }}
                />

                {/* Center circle */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={color.main}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                />

                {/* Value text */}
                <text
                    x={cx}
                    y={cy - 25}
                    textAnchor="middle"
                    className="fill-foreground text-3xl font-bold"
                    style={{ fontSize: "32px", fontWeight: 700 }}
                >
                    {clampedValue}
                </text>

                {/* Status text */}
                <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: "12px" }}
                >
                    {getStatus(clampedValue)}
                </text>
            </svg>

            {/* Label below */}
            <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
        </div>
    );
}
