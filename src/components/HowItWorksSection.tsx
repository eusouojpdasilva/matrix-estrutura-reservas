import { useReveal } from "@/hooks/useReveal";

const bullets = [
  "Escolher a época errada para ver aurora boreal ou viver o sol da meia-noite",
  "Reservar hotéis isolados e perder horas em deslocamentos",
  "Tentar encaixar países demais em uma viagem de poucos dias",
  "Seguir um pacote que não respeita seu ritmo nem seus interesses",
  "Ter de resolver sozinho mudanças de clima e imprevistos no destino",
];

const steps = [
  { num: "01", label: "Escuta ativa", title: "Entendemos sua viagem",
    desc: "Conversamos sobre o que vocês já viveram, o que querem sentir agora e qual ritmo combina com vocês." },
  { num: "02", label: "Curadoria de destino", title: "Desenhamos o caminho",
    desc: "Combinamos estação, destinos, distâncias e experiências para que cada escolha tenha sentido." },
  { num: "03", label: "Rede local", title: "Cuidamos da execução",
    desc: "Selecionamos hospedagens, guias e fornecedores locais e, se você desejar, cuidamos também das reservas." },
  { num: "04", label: "Acompanhamento", title: "Seguimos com você",
    desc: "A orientação continua antes, durante e depois da viagem, inclusive quando o clima muda os planos." },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="section-padding" style={{ background: "#FFFFFF" }}>
      <div className="container max-w-[1100px]">
        {/* Header */}
        <div className="max-w-[820px] mb-16">
          <span className="eyebrow text-scandia-purple mb-5 block">O problema mais comum</span>
          <h2 className="font-serif text-foreground leading-[1.1] mb-7" style={{ fontSize: "clamp(26px, 4.5vw, 56px)", fontWeight: 500 }}>
            Você já pesquisou sobre o norte da Europa.{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Falta clareza
            </em>{" "}
            para decidir
          </h2>
          <p className="font-sans font-light text-foreground/72 mb-8" style={{ fontSize: "17px", lineHeight: 1.7 }}>
            Entre aurora, fiordes, longas distâncias e estações muito diferentes, uma
            escolha errada pode custar dias e dinheiro. Você não precisa virar especialista
            em Islândia ou Noruega para acertar hotel, época e roteiro. Precisa de alguém
            que conheça os destinos e organize as decisões com você.
          </p>

          <ul className="space-y-3 mb-12">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 items-start">
                <span className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-scandia-purple" />
                <span className="font-sans text-[15px] md:text-[16px] text-foreground/85 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          <div
            className="p-8 md:p-10 rounded-lg"
            style={{ background: "linear-gradient(135deg, #0F1B2D, #4A6278)", border: "1px solid rgba(244,241,236,0.12)" }}
          >
            <div className="h-[2px] w-10 mb-5" style={{ background: "linear-gradient(90deg, #0F1B2D, #4A6278)" }} />
            <h3 className="text-scandia-cream italic mb-4" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 400 }}>
              "Pesquisei tanto que ficou mais difícil escolher a época, o trajeto e onde ficar."
            </h3>
            <p className="font-sans font-light text-offwhite" style={{ fontSize: "16px", lineHeight: 1.7 }}>
              Informações soltas não mostram como ligar os lugares sem transformar as férias
              em uma maratona. Nosso trabalho é dar critério a cada escolha e deixar espaço
              para viver o destino, com conforto e tranquilidade.
            </p>
          </div>
        </div>

        {/* Process header */}
        <div className="max-w-[820px] mb-10">
          <span className="eyebrow text-scandia-purple mb-5 block">O processo</span>
          <h3 className="font-serif text-foreground leading-[1.15] mb-4" style={{ fontSize: "clamp(22px, 3.5vw, 42px)", fontWeight: 500 }}>
            Como funciona a{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>consultoria</em>
          </h3>
          <p className="font-sans font-light text-foreground/72" style={{ fontSize: "16px", lineHeight: 1.65 }}>
            Da primeira conversa ao retorno, você tem uma especialista nos destinos em cada etapa.
          </p>
        </div>

        {/* 4 cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[3px]">
          {steps.map((s, i) => <StepCard key={s.num} step={s} index={i} />)}
        </div>

        <div className="mt-8 rounded-lg border border-scandia-purple/15 bg-[#F4F1EC] p-7 md:p-9">
          <span className="eyebrow text-scandia-purple block mb-3">A consultoria</span>
          <p className="font-sans text-[16px] leading-relaxed text-foreground/85 max-w-[850px]">
            Planejamento personalizado para viagens de até 15 dias, com roteiro,
            curadoria da melhor época, logística entre destinos e experiências locais.
            O investimento no planejamento é de R$ 1.500 e esse valor é abatido
            caso você escolha fazer as reservas com a Scandia.
          </p>
        </div>
      </div>
    </section>
  );
};

const StepCard = ({ step, index }: { step: typeof steps[number]; index: number }) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} relative p-8 md:p-10 group transition-all duration-300 overflow-hidden`}
      style={{
        background: "linear-gradient(160deg, #0F1B2D 0%, #4A6278 100%)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
           style={{ background: "linear-gradient(90deg, #0F1B2D, #4A6278)" }} />
      <span aria-hidden className="absolute top-2 right-4 select-none pointer-events-none"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "64px", color: "rgba(15,27,45,0.14)", lineHeight: 1 }}>
        {step.num}
      </span>
      <span className="eyebrow text-scandia-cream">{step.label}</span>
      <h4 className="font-serif text-offwhite mt-3 mb-3" style={{ fontSize: "22px", fontWeight: 500 }}>{step.title}</h4>
      <p className="font-sans font-light text-offwhite text-[15px] leading-relaxed">{step.desc}</p>
    </div>
  );
};

export default HowItWorksSection;
