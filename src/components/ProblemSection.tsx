import { Bed, Ticket, Route, GraduationCap } from "lucide-react";

const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

const items = [
  { icon: Bed, text: "Hospedagens bem localizadas, confortáveis e coerentes com cada etapa da viagem" },
  { icon: Ticket, text: "Experiências escolhidas com guias e fornecedores locais, longe do roteiro de excursão" },
  { icon: Route, text: "Estações, distâncias e conexões pensadas para aproveitar cada dia sem correria" },
  { icon: GraduationCap, text: "Orientação e acompanhamento antes, durante e depois da viagem" },
];

const ProblemSection = () => {
  return (
    <section className="section-padding" style={{ background: "#F4F1EC" }}>
      <div className="container max-w-[1100px]">
        <div className="max-w-[760px] mb-12">
          <span className="eyebrow text-scandia-purple mb-5 block">
            Islândia · Noruega · Suécia · Finlândia
          </span>
          <h2 className="font-serif leading-[1.1] mb-5" style={{ color: "#0F1B2D", fontSize: "clamp(26px, 4.5vw, 56px)", fontWeight: 500 }}>
            Uma viagem que faz sentido{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>para você</em>
          </h2>
          <p className="font-sans font-light mb-2 max-w-[640px]" style={{ color: "#0F1B2D", fontSize: "clamp(15px, 3.5vw, 18px)", lineHeight: 1.65 }}>
            Uma consultoria para transformar o que você sonha viver no norte da Europa
            em um plano possível, bem encadeado e no seu ritmo.
          </p>
        </div>

        <ul className="grid md:grid-cols-2 gap-5 md:gap-6 mb-12">
          {items.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex gap-4 p-6 rounded-lg bg-white/55 border border-scandia-purple/15 backdrop-blur-sm"
            >
              <div
                className="shrink-0 flex items-center justify-center w-12 h-12 rounded-md text-white"
                style={{ background: "linear-gradient(135deg, #0F1B2D, #4A6278)" }}
                aria-hidden
              >
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <p className="font-sans font-light text-[16px] leading-relaxed" style={{ color: "#0F1B2D" }}>
                {text}
              </p>
            </li>
          ))}
        </ul>

        <div>
          <button onClick={scrollToForm} className="btn-brand">
            Começar meu planejamento →
          </button>
          <p className="mt-3 text-[13px] tracking-wider" style={{ color: "#0F1B2D" }}>
            Atendimento personalizado para cada viagem.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
