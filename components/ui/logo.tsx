import Link from 'next/link';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className = '', width, height = 40 }: LogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            {/* FLAT ICON — no gradient, solid #1A6BFF */}
            <svg
                className="shrink-0"
                style={{ width: height, height: height }}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <polyline points="10,78 28,60 42,68 58,40 72,30 90,14" stroke="#1A6BFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"></polyline>
                {/* dots */}
                <circle cx="10" cy="78" r="5.5" fill="#1A6BFF"></circle>
                <circle cx="28" cy="60" r="5" fill="#1A6BFF"></circle>
                <circle cx="42" cy="68" r="4.5" fill="#1A6BFF"></circle>
                <circle cx="58" cy="40" r="5" fill="#1A6BFF"></circle>
                <circle cx="72" cy="30" r="4.5" fill="#1A6BFF"></circle>
                <circle cx="90" cy="14" r="7" fill="#1A6BFF"></circle>
            </svg>

            {/* WORDMARK + TAGLINE */}
            <div className="flex flex-col justify-center" style={{ fontFamily: 'var(--font-sora), sans-serif' }}>
                <span
                    className="font-bold text-black dark:text-white leading-none tracking-tight"
                    style={{ fontSize: height * 0.6 + 'px' }}
                >
                    Previzor
                </span>
                <span
                    className="text-[#606E85] dark:text-[#A1A7BB] leading-none mt-[3px]"
                    style={{ fontSize: height * 0.28 + 'px' }}
                >
                    Onde a probabilidade encontra o futuro.
                </span>
            </div>
        </Link>
    );
}
