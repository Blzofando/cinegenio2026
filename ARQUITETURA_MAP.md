# ARQUITETURA_MAP.md - CineGenio 2026

## 1. Estrutura de Pastas e Componentes

- `src/app/`: Rotas do Next.js (App Router).
- `src/components/`: Componentes de interface.
- `src/components/ui/`: Componentes base (Botões, Cards, Badges).
  - `Button/`: Componente de botão padronizado e decomposto.
  - `Skeleton.tsx`: Componente base para estados de carregamento (Skeleton Screen).
  - `ConfirmModal.tsx`: Modal de confirmação padronizado.
  - `Modal/`: Sistema de modal modular (Header, Body, Wrapper).
  - `Logo/`, `LevelBadge/`, `FeatureCard/`: Elementos visuais atômicos.
- `src/components/shared/`: Carrosséis, Modais e elementos reaproveitados entre páginas.
  - `skeletons/`: Sistema de carregamento visual padronizado (`MediaGridSkeleton`, `MediaDetailsSkeleton`, `RecommendationSkeleton`).
- `src/lib/`: Serviços e integrações (Firebase, TMDB, AI).
- `src/hooks/`: Lógica de estado e efeitos reutilizáveis.

## 2. Fluxo de Dados e Autenticação

- **Firebase Auth**: Gerencia o login.
- **Firestore**: Armazena dados do usuário (stats, watchlist, histórico).
- **TMDB API**: Fonte primária de metadados de filmes e séries.
- **ApprovalGuardian**: Componente de segurança que bloqueia acesso se `isApproved` for falso.

## 3. Regras de Negócio e Segurança

- **Status de Aprovação**: O usuário DEVE ter `isApproved: true` no banco para acessar conteúdos.
- **Strict-DRY**: Proibição de duplicação de lógica. Componentes de UI devem ser estritamente reutilizados de `src/components/ui`.
- **UI/UX Lock**: Estilos apenas via Tailwind, proibição de inline styles estáticos. Referência visual em `/referencia`.

## 4. Conexões de Arquivos (Mapeamento Atualizado)

- `Button/Button.tsx` -> Substituto universal para `<button>` nativos.
- `Modal/` -> Centraliza toda a lógica de diálogos e popups.
- `ApprovalGuardian.tsx` -> Implementado para garantir barreira de conteúdo pós-login.
- `src/lib/firebase/core/` -> Funções atômicas (`getDocument`, `setDocument`, `getDocuments`) que centralizam as operações do Firestore.
- `firestore.ts` -> Agora atua como uma camada de abstração limpa, utilizando o core atômico.
- **Componentes Globais:**
  - `Loading.tsx`: Componente centralizado para estados de carregamento (Skeleton ou Spinner).
  - `SearchBar.tsx`: Agora utilizando o hook `useSearchBar.ts` para desacoplar a lógica de busca e formatação.
- **Tipos e Interfaces (`src/types/index.ts`):**
  - `DisplayableItem`: Expandido para incluir `season` e `episode`, permitindo passagem de contexto de séries para o Player.
- **VideoPlayer (Modular):**
  - `VideoPlayerModal.tsx`: Orquestrador da UI do player. Agora utiliza `backdropUrl` para estética visual e sincroniza o estado inicial de séries (`season`/`episode`) com os metadados passados pelas páginas.
  - `useVideoPlayerProgress.ts`: Hook para lógica de persistência e eventos do player.
  - `PlayerFrame.tsx` & `ServerToggle.tsx`: Componentes atômicos de UI.
  - `videoPlayerUtils.ts`: Gerador de URLs centralizado.
- **Sistema de Skeletons (Padronização de Loadings):**
  - Todas as páginas de categoria, sugestões e modais de detalhes agora utilizam componentes de Skeleton ou o componente `Loading` centralizado, garantindo uma transição visual suave e consistente.

- **Header e Identidade Visual (Design Premium V1.1):**
  - `CineGenioIcon.tsx`: Ícone oficial da marca (estrela estilizada com gradiente e borda neon), utilizado no header e no favicon.
  - `DashboardHeader.tsx`: Redesenhado como `fixed top-0` com efeito de `glassmorphism`, fade estendido (`pt-5 pb-14`) e gradiente denso (`via-black/95`). Navegação com fontes destacadas e perfil de usuário com maior opacidade e nome visível.
  - `HeroCarousel.tsx`: Altura aumentada para `90vh` com conteúdo reposicionado (`pb-32`) para evitar proximidade com o header. Adição de gradiente superior reverso e `object-top` para fusão perfeita e melhor visualização das imagens.
  - `SearchBar.tsx`: Opacidade reforçada (`bg-white/20`) para maior destaque no novo design.
  - `favicon.ico`: Substituído por `icon.svg` via metadados globais.

- **Sistema de Scrollbar (Estética Premium):**
  - `globals.css`: Implementada scrollbar personalizada com `overflow-y: overlay`, fundo transparente e thumb que aparece apenas ao passar o mouse (`hover-reveal`), sobrepondo visualmente o header para evitar saltos de layout e manter a imersão.
- **Padronização de Alinhamento (Visual Excellence):**
  - Alinhamento horizontal rigoroso de todos os componentes (Dashboard, Filmes, Séries) utilizando a escala de padding `px-4 md:px-6 lg:px-8 xl:px-12`.
  - Remoção de `max-w` e `mx-auto` do `DashboardHeader` e `HeroCarousel` para garantir alinhamento total com as bordas da tela e consistência visual em qualquer largura.
  - Remoção de indicadores visuais de seção (barras roxas) em todos os tipos de carrosséis (`MovieCarousel`, `TopTenCarousel`, `ContinueWatchingCarousel`, `ComingSoonCarousel`, `CategoryCarousel`).
  - Implementação da estratégia de `Spacers` (elementos invisíveis de padding) no início e fim dos containers de scroll para garantir que o carrossel inicie perfeitamente alinhado com o título e mantenha o padding final correto sem quebras de layout.
  - Ajuste de offset nos carrosséis Top 10 para compensar números flutuantes e garantir alinhamento perfeito com os títulos.

---

**Última Atualização:** 2026-03-20 por Antigravity (Refinamento de Design: Alinhamento de Carrosséis, Remoção de Barras de Título e Correção de Scroll)*
