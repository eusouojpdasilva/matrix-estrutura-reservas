import { useReveal } from "@/hooks/useReveal";

const bullets = [
  "Roteiros copiados da internet que ignoram seu ritmo e seus interesses",
  "Hospedagens escolhidas pela foto, não pela localização real",
  "Ingressos perdidos por não saber o que precisa ser reservado com antecedência",
  "Dias mal distribuídos que cansam mais do que aproveitam",
  "Deslocamentos subestimados que atrasam tudo",
];

const steps = [
  { num: "01", label: "Primeiro passo", title: "Análise do seu perfil",
    desc: "Você preenche um breve formulário com o destino que quer, o tempo disponível e o que prioriza na viagem." },
  { num: "02", label: "Alinhamento inicial", title: "Conversa no WhatsApp",
    desc: "Antes do agendamento, um breve contato para entender melhor sua situação e garantir que a consultoria faz sentido pra você." },
  { num: "03", label: "A consultoria", title: "Sessão com nossa equipe",
    desc: "Um bate-papo onde nossa equipe entende seu perfil, fala sobre roteiros ideais e apresenta os modelos de consultoria ideal para você." },
  { num: "04", label: "Planejamento da viagem", title: "Roteiro e reservas",
    desc: "Roteiro personalizado, hospedagens selecionadas, ingressos, passeios e passagens cuidados do início ao fim." },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="section-padding" style={{ background: "#FFFFFF" }}>
      <div className="container max-w-[1100px]">
        {/* Header */}
        <div className="max-w-[820px] mb-16">
          <span className="eyebrow text-scandia-purple mb-5 block">O problema mais comum</span>
          <h2 className="font-serif text-foreground leading-[1.1] mb-7" style={{ fontSize: "clamp(26px, 4.5vw, 56px)", fontWeight: 500 }}>
            Existe muita informação sobre a Europa.{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              E pouca clareza
            </em>{" "}
            sobre o que fazer
          </h2>
          <p className="font-sans font-light text-foreground/72 mb-8" style={{ fontSize: "17px", lineHeight: 1.7 }}>
            Quem começa a pesquisar uma viagem à Europa rapidamente se perde em grupos, blogs
            contraditórios, preços que mudam todo dia e roteiros genéricos que servem para qualquer
            pessoa — e por isso não funcionam direito para ninguém. A dificuldade não é falta de
            informação. É saber o que vale para o seu caso.
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
              "Pesquisei muito, mas na hora de montar o roteiro, não sabia por onde começar."
            </h3>
            <p className="font-sans font-light text-offwhite" style={{ fontSize: "16px", lineHeight: 1.7 }}>
              Isso é o que a maioria das pessoas sente. A Europa parece simples de pesquisar, mas tem muita
              decisão importante que não aparece nos guias: o que vale a pena, o que você pode pular, o que
              precisa ser reservado com meses de antecedência. Uma conversa com quem planeja
              viagens resolve isso em minutos.
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
            Da primeira conversa ao embarque, você tem orientação especializada em cada etapa.
          </p>
        </div>

        {/* 4 cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[3px]">
          {steps.map((s, i) => <StepCard key={s.num} step={s} index={i} />)}
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
