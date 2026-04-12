"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Film, Tv, Bookmark, Heart, ThumbsUp, Meh, ThumbsDown,
  CheckCheck, Sparkles, Brain, Star
} from 'lucide-react';
import DashboardHeader from '@/components/shared/DashboardHeader';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileData, WatchedProfileItem } from '@/hooks/useProfileData';
import { WatchlistItem } from '@/types';
import type { RatingType } from '@/lib/watchedService';

/* ─────────────────────────────────────────────
   Metadados por rating
───────────────────────────────────────────── */
const RATING_META: Record<RatingType, { label: string; Icon: React.ElementType; color: string; dot: string; bg: string }> = {
  amei:       { label: 'Amei',       Icon: Heart,      color: 'text-pink-400',   dot: 'bg-pink-400',   bg: 'bg-pink-900/20' },
  gostei:     { label: 'Gostei',     Icon: ThumbsUp,   color: 'text-green-400',  dot: 'bg-green-400',  bg: 'bg-green-900/20' },
  meh:        { label: 'Meh',        Icon: Meh,        color: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-900/20' },
  nao_gostei: { label: 'Não Gostei', Icon: ThumbsDown, color: 'text-red-400',    dot: 'bg-red-400',    bg: 'bg-red-900/20' },
};

/* ─────────────────────────────────────────────
   DossierFolder — pasta compacta com fan
   Mais recente = frente (z-index maior)
───────────────────────────────────────────── */
function DossierFolder({
  label, tabVariant, count, items, href, loading, renderBadge,
}: {
  label: string;
  tabVariant: 'paper' | 'metal';
  count: number;
  items: { id: number | string; title: string; posterUrl?: string; tmdbMediaType: 'movie' | 'tv'; rating?: RatingType }[];
  href: string;
  loading: boolean;
  renderBadge?: (item: any) => React.ReactNode;
}) {
  const isPaper = tabVariant === 'paper';
  const previewItems = items.slice(0, 3);
  const FAN_CLASSES = ['fan-p0', 'fan-p1', 'fan-p2'] as const;

  const subtitleCount = isPaper ? `#${count} CONCLUÍDOS` : `#${count} AGUARDANDO`;
  const subtitleDesc  = isPaper ? 'Arquivo Cinematográfico' : 'Fila de Espera';

  return (
    <Link href={href} className="group/folder block relative pt-7 select-none hover:scale-[1.03] transition-transform duration-300 ease-out">
      {/* Aba */}
      <div className={`absolute top-0 left-0 px-5 py-1.5 rounded-t-xl z-10 text-[10px] font-black uppercase tracking-[0.22em] ${isPaper ? 'folder-tab-paper' : 'folder-tab-metal'}`}>
        {label}
      </div>

      {/* Corpo — overflow-hidden para clicar a pasta inferiora dos posters */}
      <div className={`
        relative rounded-tr-xl rounded-b-xl overflow-hidden noir-shadow border
        ${isPaper
          ? 'bg-[#14110a] paper-texture border-amber-900/15'
          : 'bg-[#0f0f16] metal-texture border-purple-900/15'}
        group-hover/folder:shadow-[0_28px_60px_rgba(0,0,0,0.9)]
        transition-shadow duration-300
      `}>

        {/* Glow interno */}
        <div className={`absolute inset-0 pointer-events-none ${isPaper ? 'bg-gradient-to-br from-amber-500/5 to-transparent' : 'folder-glow-purple'}`} />

        {/* ── TOPO: subtítulo em destaque + VER TODOS ── */}
        <div className="relative z-20 flex items-start justify-between px-5 pt-5 pb-0">
          <div>
            {/* #N concluídos / #N aguardando — é o texto de destaque pois o título já está na aba */}
            <p className={`text-2xl font-black leading-none ${isPaper ? 'text-amber-400/90' : 'text-purple-400/90'}`}>
              {loading ? '…' : subtitleCount}
            </p>
            {/* Descrição da coleção */}
            <p className={`text-[10px] mt-1 uppercase tracking-widest ${isPaper ? 'text-amber-200/30' : 'text-purple-200/30'}`}>
              {subtitleDesc}
            </p>
          </div>

          {/* VER TODOS — topo direito */}
          <span className={`
            shrink-0 text-[9px] font-black uppercase tracking-widest mt-1
            px-3 py-1.5 rounded-lg border transition-all duration-200
            ${isPaper
              ? 'bg-amber-900/20 border-amber-700/15 text-amber-300/70 group-hover/folder:bg-amber-200/15 group-hover/folder:text-amber-200/90'
              : 'bg-purple-900/18 border-purple-700/15 text-purple-300/70 group-hover/folder:bg-purple-200/12 group-hover/folder:text-purple-200/90'}
          `}>
            Ver todos
          </span>
        </div>

        {/*
          ── ÁREA DE CAPAS ──
          Estratégia nova: container SEM overflow-hidden lateral (evita clip das capas rotacionadas).
          O overflow-hidden do body externo é suficiente p/ a forma da pasta.
          Empurramos as capas pra baixo com marginBottom negativo → base da capa some abaixo
          da borda inferior da pasta, exibindo apenas o trecho de cima (rostos/títulos).
        */}
        <div className="relative z-10 h-[115px] mt-4">
          {loading ? (
            <div className="flex justify-center items-end h-full gap-2 pb-0">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="bg-white/4 animate-pulse rounded-xl"
                  style={{ width: '80px', height: '105px' }}
                />
              ))}
            </div>
          ) : previewItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-1 text-white/15">
              {isPaper ? <CheckCheck className="w-8 h-8" /> : <Bookmark className="w-8 h-8" />}
              <p className="text-xs">Vazia</p>
            </div>
          ) : (
            /*
              Posters: largura 80px, altura 160px (2:3).
              marginBottom: -50px empurra a base 50px pra fora → pasta clipa ~1/3 inferior.
              Vemos o topo: capas, rostos, títulos.
              Sem overflow-hidden aqui → fan rotation não é cortada nas laterais.
            */
            <div className="flex justify-center items-end h-full">
              {previewItems.map((item, i) => {
                const src = item.posterUrl
                  ? (item.posterUrl.startsWith('http') ? item.posterUrl : `https://image.tmdb.org/t/p/w342${item.posterUrl}`)
                  : null;
                const zIdx = previewItems.length - i;

                return (
                  <div
                    key={`${item.id}-${i}`}
                    className={`relative rounded-xl overflow-hidden poster-shadow border border-white/10 fan-poster ${FAN_CLASSES[i]}`}
                    style={{
                      width: '105px',
                      height: '160px',
                      marginBottom: '-55px', // empurra a base pra fora da pasta
                      zIndex: zIdx,
                      transformOrigin: 'center bottom',
                      marginLeft: i === 0 ? 0 : '-12px',
                    }}
                  >
                    {src ? (
                      <Image src={src} alt={item.title} fill className="object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        {item.tmdbMediaType === 'movie'
                          ? <Film className="w-6 h-6 text-white/10" />
                          : <Tv className="w-6 h-6 text-white/10" />}
                      </div>
                    )}
                    {renderBadge && (
                      <div className="absolute top-1.5 right-1.5">{renderBadge(item)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   StatCard
───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number | string; accent: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-white/[0.03] border border-white/5 p-4 hover:border-white/10 transition-colors">
      <Icon className={`w-4 h-4 ${accent}`} />
      <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">{label}</p>
      <p className="text-3xl font-black text-white/90 tracking-tighter">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Perfil IA
───────────────────────────────────────────── */
function IAProfilePanel({ watched, watchlist }: { watched: WatchedProfileItem[]; watchlist: WatchlistItem[] }) {
  const stats = [
    { key: 'PADRÃO DE COMPORTAMENTO', val: 'Você evita finais felizes',       accent: 'text-purple-300/90' },
    { key: 'HÁBITO DE CONSUMO',       val: 'Você consome conteúdo à noite',   accent: 'text-white/90' },
    { key: 'DNA DE DIRETOR',          val: 'Nolan & Villeneuve',              accent: 'text-amber-400/90' },
    { key: 'GÊNERO DOMINANTE',        val: 'THRILLER',                        accent: 'text-white' },
  ];

  return (
    <div className="relative rounded-xl overflow-hidden noir-shadow border border-purple-900/20
                    bg-[#1a1820] metal-texture h-full">

      {/* Glow roxo */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -left-4 bottom-0 w-24 h-24 bg-violet-600/6 blur-2xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-2">
        <Brain className="w-5 h-5 text-purple-300" />
        <h3 className="text-sm font-black uppercase tracking-[0.15em] text-purple-100/90">PERFIL IA</h3>
      </div>

      {/* Estatísticas */}
      <ul className="relative z-10 px-5 py-4 space-y-5">
        {stats.map(({ key, val, accent }) => (
          <li key={key}>
            <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">{key}</p>
            <p className={`text-[15px] font-bold ${accent}`}>{val}</p>
          </li>
        ))}
      </ul>

      {/* Rodapé */}
      <div className="relative z-10 mx-5 mb-6 pt-5 border-t border-white/5">
        <p className="text-[11px] text-white/60 italic leading-relaxed font-medium">
          "Sua preferência por tramas não-lineares aumentou 15% nos últimos 30 dias."
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Pasta LISTAS — Coleções personalizadas
───────────────────────────────────────────── */
function DossierListasFolder() {
  const FAN_CLASSES = ['fan-p0', 'fan-p1', 'fan-p2'] as const;
  const listas = [
    { id: '1', title: 'MEU TOP 10', icon: Star, bg: 'from-amber-600/60 to-amber-900/80', color: 'text-amber-100' },
    { id: '2', title: 'SÉRIES', icon: Tv, bg: 'from-sky-600/60 to-sky-900/80', color: 'text-sky-100' },
    { id: '3', title: 'FILMES', icon: Film, bg: 'from-emerald-600/60 to-emerald-900/80', color: 'text-emerald-100' },
  ];

  return (
    <Link href="/dashboard/watched" className="group/folder block relative pt-7 select-none hover:scale-[1.02] transition-transform duration-300 ease-out h-full">
      {/* Aba */}
      <div className="absolute top-0 left-0 px-5 py-1.5 rounded-t-xl z-10 text-[10px] font-black
                      uppercase tracking-[0.22em] text-emerald-300/80"
           style={{ background: 'linear-gradient(135deg,#0d1a16 0%,#040a08 100%)', border: '1px solid rgba(16,185,129,0.15)', borderBottom: 'none' }}>
        LISTAS
      </div>

      {/* Corpo */}
      <div className="relative rounded-tr-xl rounded-b-xl overflow-hidden noir-shadow border border-emerald-900/20
                      transition-shadow duration-300 h-full
                      group-hover/folder:shadow-[0_28px_60px_rgba(0,0,0,0.9)] bg-[#040a08]"
           style={{ background: 'linear-gradient(160deg,#0a1712 0%,#040a08 100%)' }}>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-600/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-20 flex items-start justify-between px-5 pt-5 pb-0">
          <div>
            <p className="text-2xl font-black leading-none text-emerald-400/90">
              #3 LISTAS
            </p>
            <p className="text-[10px] mt-1 uppercase tracking-[0.2em] text-emerald-200/30 font-bold">
              Recomendações by me
            </p>
          </div>
        </div>

        {/* Leque de cards falsos */}
        <div className="relative z-10 h-[115px] mt-4">
          <div className="flex justify-center items-end h-full">
            {listas.map((item, i) => {
              const zIdx = listas.length - i;
              const LIcon = item.icon;
              return (
                <div
                  key={`${item.id}-${i}`}
                  className={`relative rounded-xl overflow-hidden poster-shadow border border-white/10 fan-poster ${FAN_CLASSES[i]}`}
                  style={{
                    width: '105px',
                    height: '160px',
                    marginBottom: '-55px',
                    zIndex: zIdx,
                    transformOrigin: 'center bottom',
                    marginLeft: i === 0 ? 0 : '-12px',
                  }}
                >
                  <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${item.bg}`}>
                    <LIcon className={`w-10 h-10 ${item.color} opacity-40 mb-3`} />
                    <span className={`text-[11px] font-black uppercase text-center ${item.color} leading-tight drop-shadow-md`}>
                      {item.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Pasta RESENHAS — estilo Noir Dossier (Cinza)
───────────────────────────────────────────── */
function DossierResenhasFolder({ watched, loading }: { watched: WatchedProfileItem[]; loading: boolean }) {
  const totalResenhas = watched.length;
  const last = watched[0] ?? null;
  const lastMeta = last ? RATING_META[last.rating] : null;
  const LastIcon = lastMeta?.Icon ?? Star;
  const posterSrc = last?.posterUrl
    ? (last.posterUrl.startsWith('http') ? last.posterUrl : `https://image.tmdb.org/t/p/w342${last.posterUrl}`)
    : null;

  return (
    <Link href="/dashboard/watched" className="group/resenhas block relative pt-7 select-none hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Aba */}
      <div className="absolute top-0 left-0 px-5 py-1.5 rounded-t-xl z-10 text-[10px] font-black
                      uppercase tracking-[0.22em] text-gray-300/80"
           style={{ background: 'linear-gradient(135deg,#222 0%,#111 100%)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
        RESENHAS
      </div>

      {/* Corpo */}
      <div className="relative rounded-tr-xl rounded-b-xl overflow-hidden noir-shadow border border-white/5
                      transition-shadow duration-300 h-full
                      group-hover/resenhas:shadow-[0_28px_60px_rgba(0,0,0,0.9)]"
           style={{ background: 'linear-gradient(160deg,#111 0%,#050505 100%)' }}>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-20 flex items-start justify-between px-5 pt-5 pb-0">
          <div>
            <p className="text-2xl font-black leading-none text-white/90">
              {loading ? '…' : `#${totalResenhas} CRÍTICAS`}
            </p>
            <p className="text-[10px] mt-1 uppercase tracking-widest text-white/20">Arquivo de opiniões</p>
          </div>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest mt-1 px-3 py-1.5
                           rounded-lg border border-white/10 bg-white/5 text-white/60
                           group-hover/resenhas:bg-white/10 group-hover/resenhas:text-white/90 transition-all">
            Ver todas
          </span>
        </div>

        <div className="relative z-10 mx-5 my-3 flex items-center gap-2">
          <p className="text-[8px] uppercase tracking-[0.25em] text-white/10 font-bold whitespace-nowrap">ÚLTIMA RESENHA</p>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="relative z-10 mx-5 mb-5">
          {loading ? (
             <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
          ) : !last ? (
            <div className="py-4 text-center text-[10px] text-white/10 uppercase tracking-widest font-black">Nenhuma resenha</div>
          ) : (
            <div className="flex gap-4 items-start">
              <div className="relative shrink-0">
                <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden poster-shadow border border-white/10">
                  {posterSrc ? <Image src={posterSrc} alt={last.title} fill className="object-cover" /> : <Film className="w-4 h-4 text-white/10 m-auto mt-4" />}
                </div>
                {lastMeta && <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full ${lastMeta.dot} flex items-center justify-center border-2 border-[#050505]`}><LastIcon className="w-3 h-3 text-black" /></div>}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-xs text-white/20 uppercase tracking-widest font-bold">{last.tmdbMediaType === 'movie' ? 'Filme' : 'Série'}</p>
                <p className="text-sm font-black text-white/80 leading-tight mt-0.5 line-clamp-2">{last.title}</p>
                {lastMeta && <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full ${lastMeta.bg}`}><LastIcon className={`w-3 h-3 ${lastMeta.color}`} /><span className={`text-[9px] font-black uppercase tracking-widest ${lastMeta.color}`}>{lastMeta.label}</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Resenhas — últimas avaliações
───────────────────────────────────────────── */
function ReviewsSection({ watched, loading }: { watched: WatchedProfileItem[]; loading: boolean }) {

  const last4 = watched.slice(0, 4);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Star className="w-3.5 h-3.5 text-amber-400/60" />
        <h2 className="font-black text-sm uppercase tracking-tighter text-white/60">Últimas Resenhas</h2>
        <div className="h-px flex-1 bg-white/5" />
        <Link href="/dashboard/watched" className="text-[9px] uppercase tracking-widest text-purple-400/50 hover:text-purple-300/80 transition-colors font-bold">
          Ver todas
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />)}
        </div>
      ) : last4.length === 0 ? (
        <div className="text-center py-8 text-white/15">
          <Sparkles className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">Nenhuma avaliação ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {last4.map((item, i) => {
            const meta = RATING_META[item.rating];
            const RIcon = meta.Icon;
            const src = item.posterUrl
              ? (item.posterUrl.startsWith('http') ? item.posterUrl : `https://image.tmdb.org/t/p/w154${item.posterUrl}`)
              : null;

            return (
              <div
                key={`review-${item.tmdbMediaType}-${item.id}-${i}`}
                className="relative flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]
                           border border-white/5 hover:border-white/10 hover:bg-white/[0.05]
                           transition-all duration-200 overflow-hidden"
              >
                {/* Poster lateral */}
                <div className="relative w-10 h-14 rounded-md overflow-hidden bg-white/5 shrink-0 poster-shadow">
                  {src
                    ? <Image src={src} alt={item.title} fill className="object-cover" />
                    : <Film className="w-4 h-4 text-white/10 m-auto mt-4" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/80 truncate leading-tight">{item.title}</p>
                  <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-wider">
                    {item.tmdbMediaType === 'movie' ? 'Filme' : 'Série'}
                  </p>
                  <div className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full ${meta.bg}`}>
                    <RIcon className={`w-2.5 h-2.5 ${meta.color} opacity-80`} />
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${meta.color} opacity-80`}>{meta.label}</span>
                  </div>
                </div>

                {/* Glow de fundo sutil */}
                <div className={`absolute inset-0 ${meta.bg} opacity-20 pointer-events-none`} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Atividade recente
───────────────────────────────────────────── */
function ActivityFeed({ watched, watchlist, loading }: { watched: WatchedProfileItem[]; watchlist: WatchlistItem[]; loading: boolean }) {
  const activities = [
    ...watched.slice(0, 3).map(w => ({
      title: w.title, poster: w.posterUrl,
      label: 'assistiu', detail: RATING_META[w.rating].label,
      Icon: RATING_META[w.rating].Icon, color: RATING_META[w.rating].color,
    })),
    ...watchlist.slice(0, 2).map(w => ({
      title: w.title, poster: w.posterUrl,
      label: 'adicionou à watchlist', detail: 'Quero ver',
      Icon: Bookmark, color: 'text-purple-400',
    })),
  ].slice(0, 5);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-black text-sm uppercase tracking-tighter text-white/60">Atividade Recente</h2>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.02] animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-white/15 text-center py-4">Nenhuma atividade ainda</p>
      ) : (
        <div className="space-y-0.5">
          {activities.map((act, i) => {
            const src = act.poster
              ? (act.poster.startsWith('http') ? act.poster : `https://image.tmdb.org/t/p/w92${act.poster}`)
              : null;
            return (
              <div key={i} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
                <div className="relative w-7 h-10 rounded overflow-hidden bg-white/5 shrink-0 poster-shadow">
                  {src ? <Image src={src} alt={act.title} fill className="object-cover" /> : <Film className="w-3 h-3 text-white/10 mx-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50 truncate">
                    <span className="text-purple-400/70 font-bold">Você</span>{' '}{act.label}{' '}
                    <span className="text-white/70 font-semibold">{act.title}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <act.Icon className={`w-2.5 h-2.5 ${act.color} opacity-55`} />
                    <p className={`text-[9px] uppercase tracking-widest ${act.color} opacity-55 font-bold`}>{act.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuth();
  const { watchlist, watched, loadingWatchlist, loadingWatched } = useProfileData(user?.uid);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials    = displayName.slice(0, 2).toUpperCase();
  const movies      = watched.filter(w => w.tmdbMediaType === 'movie');
  const series      = watched.filter(w => w.tmdbMediaType === 'tv');

  const watchedForFolder = watched.map(w => ({
    id: `${w.tmdbMediaType}_${w.id}`, title: w.title,
    posterUrl: w.posterUrl, tmdbMediaType: w.tmdbMediaType, rating: w.rating,
  }));
  const watchlistForFolder = watchlist.map(w => ({
    id: w.id, title: w.title, posterUrl: w.posterUrl, tmdbMediaType: w.tmdbMediaType,
  }));

  return (
    <div className="min-h-screen pb-28 md:pb-16">
      <DashboardHeader />
      <MobileBottomNav />

      {/* Margens maiores — espremendo layout no centro */}
      <div className="max-w-[1150px] mx-auto px-5 lg:px-8">

        {/* ── Cabeçalho de perfil ── */}
        <div className="pt-28 md:pt-32 pb-5">
          <div className="flex items-end gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700
                           flex items-center justify-center text-white font-black text-base
                           shadow-[0_4px_20px_rgba(123,63,228,0.35)] border border-purple-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.3em] text-purple-400/50 font-bold mb-0.5">Arquivo Pessoal</p>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white/90 truncate">{displayName}</h1>
              {user?.email && <p className="text-[10px] text-white/22 truncate">{user.email}</p>}
            </div>
            <div className="hidden md:flex flex-col gap-1 items-end shrink-0">
              <span className="flex items-center gap-1 bg-white/[0.03] border border-white/6 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-amber-400/65">
                <Film className="w-2.5 h-2.5" />{loadingWatched ? '…' : `${watched.length} assistidos`}
              </span>
              <span className="flex items-center gap-1 bg-white/[0.03] border border-white/6 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-purple-400/65">
                <Bookmark className="w-2.5 h-2.5" />{loadingWatchlist ? '…' : `${watchlist.length} na watchlist`}
              </span>
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          <StatCard icon={Bookmark}   label="Watchlist"  value={loadingWatchlist ? '—' : watchlist.length} accent="text-purple-400/70" />
          <StatCard icon={CheckCheck} label="Assistidos" value={loadingWatched   ? '—' : watched.length}   accent="text-amber-400/70" />
          <StatCard icon={Film}       label="Filmes"     value={loadingWatched   ? '—' : movies.length}    accent="text-sky-400/70" />
          <StatCard icon={Tv}         label="Séries"     value={loadingWatched   ? '—' : series.length}    accent="text-pink-400/70" />
        </div>

        {/* ── GRID PRINCIPAL: PASTAS (ESQ) E IA (DIR) ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8 items-start">
          
          {/* BLOCO ESQUERDO: Pastas agrupadas (Ocupa 9 colunas agora, espremendo quem tá na direita) */}
          <div className="md:col-span-9 flex flex-col gap-5">
            {/* Linha 1 das Pastas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DossierFolder
                label="ASSISTIDOS" tabVariant="paper"
                count={watched.length} items={watchedForFolder}
                href="/dashboard/watched" loading={loadingWatched}
                renderBadge={(item) => {
                  if (!item.rating) return null;
                  const meta = RATING_META[item.rating as RatingType];
                  return (
                    <div className={`${meta.dot} rounded-full w-3.5 h-3.5 flex items-center justify-center poster-shadow`}>
                      <meta.Icon className="w-2 h-2 text-[#0a0f1d]" />
                    </div>
                  );
                }}
              />
              <DossierFolder
                label="WATCHLIST" tabVariant="metal"
                count={watchlist.length} items={watchlistForFolder}
                href="/dashboard/watchlist" loading={loadingWatchlist}
              />
            </div>
            
            {/* Linha 2 das Pastas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DossierResenhasFolder watched={watched} loading={loadingWatched} />
              <DossierListasFolder />
            </div>
          </div>

          {/* BLOCO DIREITO: Perfil IA (Ocupa apenas 3 colunas agora, afinando-o) */}
          <div className="md:col-span-3 self-stretch">
            <IAProfilePanel watched={watched} watchlist={watchlist} />
          </div>
        </div>

        {/* ── ATIVIDADE RECENTE ── */}
        <div className="mb-4">
          <ActivityFeed
            watched={watched}
            watchlist={watchlist}
            loading={loadingWatched && loadingWatchlist}
          />
        </div>

      </div>
    </div>
  );
}
