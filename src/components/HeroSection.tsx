import heroIcelandImg from "@/assets/hero-islandia-aurora.jpg";

const HeroSection = () => {
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-hero-dark">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroIcelandImg}
          alt="Aurora boreal sobre a paisagem da Islândia"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns motion-reduce:animate-none"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: "rgba(15,27,45, 0.52)" }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,27,45,0.62) 0%, rgba(15,27,45,0.28) 58%, rgba(15,27,45,0.10) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 container px-5 py-20 md:py-40 max-w-[820px] md:mr-auto md:ml-0 md:pl-12 lg:pl-20">
        <span className="eyebrow text-scandia-cream block mb-5 animate-fade-up">
          Consultoria especializada em Escandinávia e Islândia
        </span>

        <h1 className="font-serif text-offwhite leading-[1.08] mb-5 animate-fade-up-delay-1" style={{ fontSize: "clamp(32px, 6vw, 76px)", fontWeight: 500 }}>
          A Escandinávia pede mais que um roteiro.
          <br />
          <span className="text-offwhite">Pede </span>
          <em className="text-scandia-cream not-italic md:italic font-medium" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            as escolhas certas
          </em>
        </h1>

        <p className="font-sans font-light text-offwhite max-w-[560px] mb-8 animate-fade-up-delay-2" style={{ fontSize: "clamp(15px, 3.5vw, 18px)", lineHeight: 1.65 }}>
          Para casais e pequenas famílias que querem viver Islândia, Noruega, Suécia
          e Finlândia com profundidade, conforto e tempo para aproveitar. Cuidamos
          da estação, do ritmo, da logística e das experiências locais — do primeiro
          plano ao retorno.
        </p>

        <div className="animate-fade-up-delay-3">
          <button onClick={scrollToForm} className="btn-brand">
            Planejar minha viagem →
          </button>
          <p className="mt-4 text-[13px] tracking-wider text-scandia-cream">
            Conte seu sonho de viagem em poucos passos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
