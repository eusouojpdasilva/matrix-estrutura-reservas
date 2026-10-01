import { useEffect, useState } from "react";

const HeroSection = () => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffsetY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-hero-dark">
      {/* Background image with Ken Burns + parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1800&q=80"
          alt="Coliseu de Roma ao entardecer"
          className="absolute inset-0 w-full h-[110%] object-cover animate-ken-burns will-change-transform"
          style={{ transform: `translateY(${offsetY * 0.25}px)` }}
          loading="eager"
          fetchPriority="high"
        />
        {/* Purple brand overlay 70% */}
        <div className="absolute inset-0" style={{ background: "rgba(15,27,45, 0.70)" }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,27,45,0.55) 0%, rgba(15,27,45,0.25) 60%, rgba(74,98,120,0.20) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 container px-5 py-20 md:py-40 max-w-[820px] md:mr-auto md:ml-0 md:pl-12 lg:pl-20">
        <span className="eyebrow text-scandia-cream block mb-5 animate-fade-up">
          Viagens e experiências sob medida na Europa
        </span>

        <h1 className="font-serif text-offwhite leading-[1.08] mb-5 animate-fade-up-delay-1" style={{ fontSize: "clamp(32px, 6vw, 76px)", fontWeight: 500 }}>
          Você já sabe que quer conhecer a Europa.
          <br />
          <span className="text-offwhite">O que falta é saber </span>
          <em className="text-scandia-cream not-italic md:italic font-medium" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            por onde começar
          </em>
        </h1>

        <p className="font-sans font-light text-offwhite max-w-[560px] mb-8 animate-fade-up-delay-2" style={{ fontSize: "clamp(15px, 3.5vw, 18px)", lineHeight: 1.65 }}>
          Nós na Scandia criamos e organizamos cada detalhe da sua viagem.
          Roteiro, hospedagens, passeios, ingressos, experiências e logística de
          deslocamento, com orientação e suporte do início ao fim.
        </p>

        <div className="animate-fade-up-delay-3">
          <button onClick={scrollToForm} className="btn-brand">
            Agendar conversa inicial →
          </button>
          <p className="mt-4 text-[13px] tracking-wider text-scandia-cream">
            Número limitado de planejamentos por período.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
