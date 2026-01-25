import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className, width = 100, height = 40 }: LogoProps) {
    return (
        <Link href="/" className={className}>
            <div className={`relative ${className}`} style={{ width, height }}>
                {/* Light Mode Logo (hidden in dark mode) */}
                <Image
                    src="/assets/img/logo-black.png"
                    alt="Previzor Logo"
                    width={width}
                    height={height}
                    className="object-contain dark:hidden"
                    priority
                />
                {/* Dark Mode Logo (hidden in light mode) */}
                <Image
                    src="/assets/img/logo-white.png"
                    alt="Previzor Logo"
                    width={width}
                    height={height}
                    className="object-contain hidden dark:block"
                    priority
                />
            </div>
        </Link>
    );
}
