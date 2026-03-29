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
- **VideoPlayer (Modular — Multi-Servidor V2):**
  - `VideoPlayerModal.tsx`: Orquestrador com **3 fases** (`episode-select` → `server-select` → `playing`). Filmes na 1ª vez: seletor de servidor. Séries na 1ª vez: seletor de episódio → servidor. Retorno: direto pro player.
  - `useVideoPlayerProgress.ts`: Hook que determina `initialPhase` baseado nos dados persistidos no Firebase. Carrega servidor, temporada/episódio salvos.
  - `videoPlayerUtils.ts`: **`ServerType`** unificado (`videasy | vidking | embedplay | superflix | megaembed | embedmovies`). Constante `SERVERS` com metadados (nome, região). Função `getPlayerUrl()` centraliza geração de URLs para todos os servidores.
  - `ServerSelector.tsx`: Grid de seleção de servidor dividido por região (Global/Brasil). Design premium com glassmorphism.
  - `ServerToggle.tsx`: Dropdown sobre o player para troca rápida de servidor durante reprodução.
  - `PlayerFrame.tsx`: Componente atômico do iframe.
  - **Dependências em cascata:** `nowWatchingService.ts`, `dualEpisodeService.ts`, `resumeService.ts`, `videoProgressService.ts`, `CombinedPlayButton.tsx` — todos usam `ServerType` importado de `videoPlayerUtils.ts`.
  - **Firebase Persistence:** Servidor, temporada, episódio e timestamp salvos em `users/{uid}/nowWatching/{docId}`. Ao retornar, o hook restaura automaticamente todas as escolhas.
- **Sistema de Skeletons (Padronização de Loadings):**
  - Todas as páginas de categoria, sugestões e modais de detalhes agora utilizam componentes de Skeleton ou o componente `Loading` centralizado, garantindo uma transição visual suave e consistente.

- **Header e Identidade Visual (Design Premium V1.1):**
  - `CineGenioIcon.tsx`: Ícone oficial da marca (estrela estilizada com gradiente e borda neon), utilizado no header e no favicon.
  - `DashboardHeader.tsx`: Redesenhado como `fixed top-0` com efeito de `glassmorphism`, fade estendido (`pt-5 pb-14`) e gradiente denso (`via-black/95`). Navegação com fontes destacadas e perfil de usuário com maior opacidade e nome visível.
  - `HeroCarousel.tsx`: Altura aumentada para `90vh` com conteúdo reposicionado (`pb-32`) para evitar proximidade com o header. Adição de gradiente superior reverso e `object-top` para fusão perfeita e melhor visualização das imagens.
  - `SearchBar.tsx`: Opacidade reforçada (`bg-white/20`) para maior destaque no novo design.
  - `favicon.ico`: Substituído por `icon.svg` via metadados globais.

- **Sistema de Scrollbar (Hidden):**
  - `globals.css`: Scrollbar completamente oculta em todos os navegadores usando `scrollbar-width: none` (Firefox) e `*::-webkit-scrollbar { display: none }` (Chrome/Safari/Edge). A funcionalidade de scroll permanece ativa, apenas a barra visual é removida.

---

**Última Atualização:** 2026-03-29 por Antigravity (Sistema Multi-Servidor V2 — 6 servidores com fluxo de reprodução em fases)*
