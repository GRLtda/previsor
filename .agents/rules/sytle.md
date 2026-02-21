---
trigger: always_on
---

1. Estrutura e Containers (Cards)
Sem Sombras Prominentes (Flat Design): Os cartões (Cards) e blocos de conteúdo não utilizam sombras pesadas (drop-shadow ou shadow-md/lg/xl). A separação visual entre os elementos e o fundo é feita puramente através de bordas sutis (border) e da cor de fundo do cartão (bg-card).
Bordas e Cantos: Utiliza-se cantos arredondados generosos (rounded-xl para os cards de métricas e rounded-lg para botões/inputs) e bordas finas com a cor padrão do tema (border).
Espaçamento (Padding): Os cards utilizam espaçamentos internos padronizados (p-4 para miniaturas de métricas e p-6 para gráficos maiores) para manter o conteúdo respirando.
2. Tipografia e Hierarquia de Texto
Métricas Principais: Números em destaque usam fonte grande, em negrito e com espaçamento de letras reduzido para impacto (text-2xl font-bold tracking-tight).
Títulos e Rótulos: Títulos de seções usam texto neutro (text-sm font-medium), enquanto descrições de apoio e legendas de tempo usam cores mais fracas e tamanhos menores para não brigar pela atenção (text-xs text-muted-foreground).
Variações de Cor (Status): Valores positivos/negativos ou ações pendentes usam cores contextuais diretamente no texto (ex: text-emerald-600 para aumentos, text-amber-600 para pendências).
3. Ícones e Destaques Visuais
Containers de Ícones: Em vez de ícones soltos, eles são colocados dentro de um pequeno círculo com fundo translúcido da mesma família de cor do ícone.
Exemplo de código: flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 com o ícone em text-blue-500.
Cores Semânticas: Cada métrica tem uma cor que representa o seu contexto (Blue para Usuários, Amber para KYC pendente, Emerald para Depósitos, Rose para Saques, etc.).
4. Interatividade e Controles
Botões e Inputs: Controles como selects, botões de atualização e inputs de data seguem o padrão "Ghost/Outline", utilizando fundos transparentes ou do próprio card (bg-transparent ou bg-background), bordas discretas (border-input) e efeitos bem simples de hover (hover:bg-muted/50).
Links Diretos: Quando um card tem uma ação associada (como "ver depósitos pendentes"), usa-se um link discreto no rodapé do card, combinando texto pequeno, cor semântica e um ícone de "link externo" bem pequeno (h-3 w-3).
Resumidamente, o design da área Admin é "Clean, Flat e Baseado em Bordas". O foco deve estar sempre em deixar a interface limpa, sem profundidade artificial (sombras), usando a cor de texto muted-foreground para aliviar o peso visual e cores vibrantes apenas em pequenos ícones e números de destaque positivo/negativo.