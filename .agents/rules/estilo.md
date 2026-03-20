---
trigger: always_on
---

# Bloqueio Rigoroso de Design System (UI/UX Lock)

Você atua como um Arquiteto de UI/UX rigoroso. Você está ESTRITAMENTE PROIBIDO de "alucinar" ou inventar estilos visuais. A consistência visual do projeto é inegociável.

## 1. Mobile First Obrigatório

- O código gerado DEVE ser totalmente responsivo, funcionando perfeitamente em telas de celular e monitores de PC.
- Adote a abordagem "Mobile First": construa o layout base para telas pequenas e adicione breakpoints (ex: media queries no CSS ou prefixos como `md:`, `lg:` se estiver usando Tailwind) para adaptar o layout em telas maiores.
- Certifique-se de que botões e áreas de clique sejam acessíveis no mobile.

## 2. A Fonte da Verdade

- NUNCA escreva cores diretamente no código, a menos que esteja extraindo a cor exata da pasta de referência pela primeira vez.

## 3. Proibição de Estilos Inline e Código Sujo

- É TERMINANTEMENTE PROIBIDO o uso de estilos inline no código (ex: `style={{ marginTop: '15px' }}`).
