import { Bed, Ticket, Route, GraduationCap } from "lucide-react";

const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

const items = [
  { icon: Bed, text: "Hospedagens alinhadas ao seu estilo de viagem e bem localizadas" },
  { icon: Ticket, text: "Ingressos e passeios reservados com parceiros confiáveis" },
  { icon: Route, text: "Logística organizada dentro e entre cidades para evitar desperdício de tempo e dinheiro" },
  { icon: GraduationCap, text: "Treinamento pré-viagem para você embarcar segura e preparada" },
];

const ProblemSection = () => {
  return (
    <section className="section-padding" style={{ background: "#F4F1EC" }}>
      <div className="container max-w-[1100px]">
        <div className="max-w-[760px] mb-12">
          <span className="eyebrow text-scandia-purple mb-5 block">
            Itália · Roma · Florença · Veneza · Milão · Amalfi · Toscana
          </span>
          <h2 className="font-serif leading-[1.1] mb-5" style={{ color: "#0F1B2D", fontSize: "clamp(26px, 4.5vw, 56px)", fontWeight: 500 }}>
            O que{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>entregamos</em>
          </h2>
          <p className="font-sans font-light mb-2 max-w-[640px]" style={{ color: "#0F1B2D", fontSize: "clamp(15px, 3.5vw, 18px)", lineHeight: 1.65 }}>
            Uma viagem 100% criada e organizada, pensada para você que quer conhecer a Europa
            no seu jeito e ritmo.
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
            Agendar conversa inicial →
          </button>
          <p className="mt-3 text-[13px] tracking-wider" style={{ color: "#0F1B2D" }}>
            Número limitado de planejamentos por período.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
