import { Bed, Ticket, Route, GraduationCap } from "lucide-react";

const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

const items = [
  { icon: Bed, title: "Hospedagens que fazem sentido", text: "Bem localizadas, confortáveis e coerentes com cada etapa da viagem." },
  { icon: Ticket, title: "Experiências com identidade", text: "Guias e fornecedores locais, longe do roteiro de excursão." },
  { icon: Route, title: "Tempo para aproveitar", text: "Estações, distâncias e conexões pensadas sem correria." },
  { icon: GraduationCap, title: "Presença em cada etapa", text: "Orientação e acompanhamento antes, durante e depois da viagem." },
];

const ProblemSection = () => {
  return (
    <section className="section-padding" style={{ background: "#F4F1EC" }}>
      <div className="container max-w-[1200px]">
        <div className="mb-12 grid items-end gap-6 md:mb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-12">
          <div>
          <span className="eyebrow text-scandia-purple mb-5 block">
            Islândia · Noruega · Suécia · Finlândia
          </span>
          <h2 className="max-w-[780px] font-serif text-[clamp(2.7rem,5vw,4.6rem)] font-medium leading-[1.04] text-[#0F1B2D] [text-wrap:balance]">
            Uma viagem que faz sentido{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>para você</em>
          </h2></div>
          <p className="max-w-[360px] text-[16px] leading-[1.75] text-[#0F1B2D]/75">
            Uma consultoria para transformar o que você sonha viver no norte da Europa
            em um plano possível, bem encadeado e no seu ritmo.
          </p>
        </div>

        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {items.map(({ icon: Icon, title, text }, index) => (
            <li
              key={text}
              className="flex min-w-0 flex-col gap-7 rounded-[5px] border border-[#0F1B2D]/10 bg-white p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-28px_rgba(15,27,45,.5)] md:min-h-[260px]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#0F1B2D]/20 text-[#0F1B2D]" aria-hidden="true"><Icon size={21} strokeWidth={1.6} /></span>
                <span className="text-[11px] font-bold tracking-[.17em] text-[#4A6278]">0{index + 1}</span>
              </div>
              <div><h3 className="font-serif text-[28px] font-semibold leading-tight text-[#0F1B2D]">{title}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-[#0F1B2D]/70">{text}</p></div>
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
