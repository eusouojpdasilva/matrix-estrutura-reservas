const FinalCTA = () => {
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative overflow-hidden section-padding bg-cta-gradient">
      {/* Decorative concentric circles */}
      <div className="absolute -top-32 -right-32 pointer-events-none" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="absolute rounded-full border"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              width: `${n * 180}px`,
              height: `${n * 180}px`,
              top: `${-n * 90}px`,
              right: `${-n * 90}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container max-w-[680px] text-center">
        <span className="eyebrow text-scandia-cream mb-5 block">Próximo passo</span>
        <h2 className="font-serif text-white leading-[1.1] mb-6" style={{ fontSize: "clamp(26px, 4.5vw, 52px)", fontWeight: 500 }}>
          Sua viagem à Europa começa com uma análise
        </h2>
        <p className="font-sans font-light text-white/80 mb-10 max-w-[560px] mx-auto" style={{ fontSize: "16px", lineHeight: 1.7 }}>
          Você preenche um formulário rápido com as informações da sua viagem. A Scandia Travel avalia
          o seu perfil e entra em contato para uma primeira conversa. Gratuito, sem compromisso.
        </p>
        <button onClick={scrollToForm} className="btn-on-gradient">
          Agendar conversa inicial →
        </button>
        <p className="mt-5 text-[13px] text-scandia-cream">
          Número limitado de planejamentos por período.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
