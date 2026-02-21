import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function UserFooter() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full bg-background border-t border-black/10 dark:border-white/5 py-12 mt-auto">
            <div className="mx-auto w-full px-4 md:px-12 lg:px-24 xl:px-[140px] 2xl:px-[256px]">
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
                                Previsões e outros mercados são regulamentados e cobertos pela
                                nossa licença de operação. Jogue com responsabilidade.
                            </p>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="lg:col-span-6 grid grid-cols-2 gap-8 lg:gap-12 lg:justify-items-end">

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

                        {/* Ajuda */}
                        <div className="flex flex-col gap-4 lg:text-left">
                            <h3 className="text-base font-semibold text-black dark:text-white mb-2">
                                Ajuda
                            </h3>
                            <ul className="flex flex-col gap-3">
                                <li>
                                    <Link href="/faq" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Perguntas Frequentes
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/como-jogar" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Como Jogar
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/suporte" className="text-sm text-[#606E85] hover:text-black dark:text-[#A1A7BB] dark:hover:text-white transition-colors">
                                        Suporte Técnico
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </footer>
    )
}
