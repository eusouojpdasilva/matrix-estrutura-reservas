import lofotenImg from "@/assets/cta-lofoten.jpg";

const FinalCTA = () => {
  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="relative overflow-hidden section-padding bg-[#0F1B2D]">
      <img
        src={lofotenImg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(15,27,45,0.82), rgba(15,27,45,0.66))" }}
      />
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
          Sua viagem ao norte começa com uma conversa
        </h2>
        <p className="font-sans font-light text-white/80 mb-10 max-w-[560px] mx-auto" style={{ fontSize: "16px", lineHeight: 1.7 }}>
          Conte o que deseja viver na Islândia ou na Escandinávia. Vamos entender
          seu perfil e conversar sobre época, ritmo e próximos passos. A conversa
          inicial é gratuita e sem compromisso.
        </p>
        <button onClick={scrollToForm} className="btn-on-gradient">
          Planejar minha viagem →
        </button>
        <p className="mt-5 text-[13px] text-scandia-cream">
          Seu roteiro começa com boas escolhas.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
