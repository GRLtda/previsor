import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Como Jogar',
}

export default function HowToPlayPage() {
    return (
        <div className="relative z-10 mx-auto flex w-full flex-col py-8 lg:py-12 px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold dark:text-white mb-6">Como Jogar</h1>

                <div className="space-y-8 mt-8">

                    <div className="flex gap-4 p-6 rounded-xl border border-black/10 dark:border-white/5 bg-card/50">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-bold">
                            1
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Escolha uma previsão</h3>
                            <p className="text-[#606E85] dark:text-[#A1A7BB]">
                                Navegue pelos eventos disponíveis na plataforma e encontre aquele que você tem maior conhecimento ou intuição sobre o resultado.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-6 rounded-xl border border-black/10 dark:border-white/5 bg-card/50">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-bold">
                            2
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Posicione-se comprando quotas</h3>
                            <p className="text-[#606E85] dark:text-[#A1A7BB]">
                                Decida se você acredita que o evento vai acontecer (SIM) ou não (NÃO). Quanto menor a probabilidade, maior o potencial de lucro caso você acerte.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-6 rounded-xl border border-black/10 dark:border-white/5 bg-card/50">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-bold">
                            3
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Acompanhe e Lucre</h3>
                            <p className="text-[#606E85] dark:text-[#A1A7BB]">
                                Acompanhe o desenrolar do evento. Ao final da apuração, se a sua previsão estiver correta, o valor total correspondente ao mercado será creditado na sua conta.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
