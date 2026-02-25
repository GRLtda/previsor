import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function UserFooter() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full bg-background py-12 mt-auto">
            <div className="mx-auto w-full px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* Logo and Copyright Info */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        <div className="flex items-center">
                            <Logo width={120} height={40} />
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-sm font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                &copy; {currentYear} previzor.com. Todos os direitos reservados.
                            </p>

                            <p className="text-sm text-[#606E85] dark:text-[#A1A7BB] leading-relaxed max-w-md">
                                A Previzor é uma plataforma inovadora de mercado de previsões. Participe, crie tendências e divirta-se.
                            </p>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="lg:col-span-6 flex justify-start lg:justify-end">

                        {/* Regulamentos */}
                        <div className="flex flex-col gap-4 lg:text-left">
                            <h3 className="text-base font-semibold text-black dark:text-white mb-2">
                                Regulamentos
                            </h3>
                            <ul className="flex flex-col gap-3">
                                <li>
                                    <Link href="/jogo-responsavel" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Jogo responsável
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacidade" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Política de Privacidade
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/termos" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Termos de Uso
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Removed Ajuda */}

                    </div>
                </div>
            </div>
        </footer>
    )
}
