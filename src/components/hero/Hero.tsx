// src/components/hero/Hero.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LevelBadge from "@/components/ui/LevelBadge";

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroEl = heroRef.current;
      if (!heroEl) return;
      setHidden(window.scrollY > heroEl.offsetHeight - 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className={`hero ${hidden ? "hero--hidden" : "hero--visible"} relative`}
      aria-label="Hero CineGênio"
    >
      {/* badge no canto superior direito */}
      <div className="absolute right-3.5 top-2 z-30">
        <LevelBadge level={7} />
      </div>

      {/* conteúdo esquerdo: título + frase (SEM CTA aqui) */}
      <div className="hero-left max-w-[62%]">
        <div className="hero-title text-neon leading-none">
          <div className="font-[900] text-[64px]">CineGênio</div>
          <div className="subtitle text-[22px] mt-1.5">Pessoal</div>
        </div>

        <div className="hero-sub mt-2.5">Seu assistente de cinema.</div>
      </div>

      {/* decor direita: CLAQUETE maior (aumentei pra 220) */}
      <div className="hero-decor" aria-hidden>
        <Image
          src="/claquete-neon.png"
          alt="Claquete"
          width={220}
          height={220}
          className="rounded-xl"
          priority={false}
        />
      </div>
    </section>
  );
}
