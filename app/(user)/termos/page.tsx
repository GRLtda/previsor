import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Termos de Uso',
}

export default function TermsOfUsePage() {
    return (
        <div className="relative z-10 mx-auto flex w-full flex-col py-8 lg:py-12 px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold dark:text-white mb-6">Termos de Uso</h1>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-[#606E85] dark:text-[#A1A7BB]">
                    <p>
                        Estes Termos de Uso governam a sua utilização da plataforma Previzor. Ao acessar nosso sistema, você concorda legalmente com as regras estabelecidas aqui.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">1. Aceitação dos Termos</h2>
                    <p>
                        Para usar nossos mercados de previsões, você deve ter ao menos 18 anos de idade e ter capacidade legal para formar contratos vinculativos na sua jurisdição.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">2. Funcionamento do Mercado</h2>
                    <p>
                        A Previzor atua como um facilitador do mercado de probabilidades. Nós não definimos as regras ou influenciamos propositalmente os eventos reais, apenas listamos os mercados e regulamos o seu bom funcionamento técnico.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">3. Resolução de Eventos</h2>
                    <p>
                        Todos os mercados são resolvidos de acordo com as regras estabelecidas previamente na página do evento. A decisão da resolução baseia-se em fontes de dados oficiais. Em caso de divergências sistêmicas, a Previzor reserva-se no direito de revisar resultados mediante auditoria.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">4. Restrições e Proibições</h2>
                    <p>
                        É terminantemente proibido o uso de exploits, bots não regularizados e múltiplas contas por usuário (abuso de KYC). O descumprimento pode causar no bloqueio imediato das contas.
                    </p>

                    <p className="pt-8 text-sm">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>
        </div>
    )
}
