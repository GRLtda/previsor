import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Perguntas Frequentes',
}

export default function FAQPage() {
    return (
        <div className="relative z-10 mx-auto flex w-full flex-col py-8 lg:py-12 px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold dark:text-white mb-6">Perguntas Frequentes (FAQ)</h1>

                <div className="space-y-8 mt-8">

                    <div className="rounded-xl border border-black/10 dark:border-white/5 bg-card/50 p-6">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">O que é a Previzor?</h3>
                        <p className="text-[#606E85] dark:text-[#A1A7BB]">
                            A Previzor é um mercado de previsões. Nele, os usuários podem comprar posições concordando (SIM) ou discordando (NÃO) de que determinado evento mundial acontecerá, usando seu conhecimento.
                        </p>
                    </div>

                    <div className="rounded-xl border border-black/10 dark:border-white/5 bg-card/50 p-6">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Como ocorrem os depósitos e saques?</h3>
                        <p className="text-[#606E85] dark:text-[#A1A7BB]">
                            Utilizamos formas de pagamento ultra-rápidas para garantir a liquidez do mercado. Todo o financeiro está disponível instantaneamente no sistema ao aprovar o envio.
                        </p>
                    </div>

                    <div className="rounded-xl border border-black/10 dark:border-white/5 bg-card/50 p-6">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Quando um evento encerra?</h3>
                        <p className="text-[#606E85] dark:text-[#A1A7BB]">
                            Cada evento possui uma data programada estipulada e regras de validação claras. Quando a condição se torna absoluta de verificação oficial, nós determinamos o lado vencedor e os lucros são distribuídos automaticamente.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    )
}
