import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Privacidade',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="relative z-10 mx-auto flex w-full flex-col py-8 lg:py-12 px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold dark:text-white mb-6">Política de Privacidade</h1>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-[#606E85] dark:text-[#A1A7BB]">
                    <p>
                        Bem-vindo à Previzor. Sua privacidade é de estrema importância para nós. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">1. Informações Coletadas</h2>
                    <p>
                        Coletamos as informações que você nos fornece diretamente, como ao criar uma conta, bem como dados gerados automaticamente durante a sua interação com os nossos serviços de previsão.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">2. Uso das Informações</h2>
                    <p>
                        Utilizamos suas informações para fornecer, manter e aprimorar nossos serviços, além de garantir a segurança da plataforma e cumprir com nossas obrigações legais.
                    </p>

                    <h2 className="text-xl font-semibold text-black dark:text-white mt-8 mb-4">3. Compartilhamento e Segurança</h2>
                    <p>
                        Não vendemos seus dados. Seus dados podem ser compartilhados com parceiros estritamente necessários para a operação do sistema. Praticamos as melhores medidas de segurança para proteger suas informações.
                    </p>

                    <p className="pt-8 text-sm">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>
        </div>
    )
}
