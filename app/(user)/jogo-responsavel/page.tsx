import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Jogo Responsável',
}

export default function ResponsibleGamingPage() {
    return (
        <div className="relative z-10 mx-auto flex w-full flex-col py-8 lg:py-12 px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold dark:text-white mb-6">Jogo Responsável</h1>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-[#606E85] dark:text-[#A1A7BB]">
                    <p>
                        Na Previzor, acreditamos que nosso mercado de previsões deve ser uma atividade divertida e de entretenimento baseada em conhecimento. Portanto, levamos a sério a responsabilidade em impedir que se transforme em um problema para os nossos usuários.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">Controle Pessoal</h2>
                    <p>
                        Recomendamos as seguintes práticas para manter o controle:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>Jogue apenas com dinheiro que você pode se dar ao luxo de perder.</li>
                        <li>Não tente "recuperar perdas" de forma irracional.</li>
                        <li>Estabeleça limites próprios de tempo e dinheiro na plataforma.</li>
                        <li>Nunca jogue sob a influência de álcool, drogas ou quando estiver chateado.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">Proteção a Menores</h2>
                    <p>
                        Manter menores não envolvidos é primordial. Nossa plataforma requer estrita verificação de idade, impedindo completamente o acesso por parte de quem tem menos de 18 anos completos.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">Precisa de Ajuda?</h2>
                    <p>
                        Se você sente que está perdendo o controle e gastando mais do que deveria, nossa equipe pode aplicar limitações temporárias ou de exclusão permanente à sua conta, basta nos solicitar.
                    </p>
                </div>
            </div>
        </div>
    )
}
