---
trigger: always_on
---

# Protocolo Rigoroso de Reutilização de Código (DRY)

1. PROIBIÇÃO DE CÓDIGO DUPLICADO:
   Você está TERMINANTEMENTE PROIBIDO de criar novas funções utilitárias, botões, modais, cards ou componentes de UI se já existir algo semelhante no projeto.

2. REGRA DO FRONT-END (Componentização):
   Antes de escrever qualquer elemento de interface em uma página nova (ex: um botão de login, um card de filme ou um input de formulário), você DEVE obrigatoriamente ler a pasta `/components` (ou `/ui`).

   Se o componente existir, importe-o e passe as propriedades (props) necessárias.

   Se o componente precisar de uma variação, altere o componente original para aceitar uma nova `prop` (ex: `variant="outline"`), em vez de criar um arquivo novo.

3. REGRA DO BACK-END E LÓGICA:
   Se você precisar escrever uma lógica de formatação de datas, cálculo financeiro, extração de áudio ou chamadas de API, verifique primeiro as pastas `/utils`, `/lib` ou `/hooks`.

   Nunca escreva a mesma função em dois arquivos diferentes. Se duas rotas precisam da mesma lógica, extraia essa lógica para um arquivo utilitário compartilhado.

4. REFATORAÇÃO IMEDIATA:
   Se durante a criação de uma funcionalidade você perceber que acabou de duplicar uma lógica que já viu em outro lugar do projeto, PARE. Refatore imediatamente extraindo o código para um componente/função global e atualize ambos os arquivos para usarem a nova versão centralizada.
