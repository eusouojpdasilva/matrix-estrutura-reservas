import { Check, X } from "lucide-react";

const forYou = [
  "Você tem uma viagem em mente mas ainda não sabe como organizar",
  "Pesquisou bastante e ficou com mais dúvidas do que certezas",
  "Quer aproveitar cada dia da viagem sem desperdício de tempo",
  "Prefere ter alguém de confiança cuidando das reservas e dos detalhes",
  "Valoriza organização e não quer surpresas desagradáveis no destino",
  "Quer uma experiência pensada para o seu perfil, não um pacote genérico",
];

const notForYou = [
  "Você quer um pacote fechado sem personalização",
  "Gosta de deixar tudo para decidir na hora, sem planejamento",
  "A única métrica é o preço mais barato, independente da experiência",
  "Prefere resolver tudo sozinho, do início ao fim",
];

const ForWhoSection = () => {
  return (
    <section className="section-padding" style={{ background: "#FFFFFF" }}>
      <div className="container max-w-[1100px] grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Para você */}
        <div className="bg-white rounded-lg p-8 md:p-11 border border-border shadow-sm">
          <span className="eyebrow text-scandia-purple mb-4 block">Esse serviço é para você se…</span>
          <h2 className="font-serif text-foreground leading-[1.15] mb-7" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 500 }}>
            Você quer uma viagem feita{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>do jeito certo</em>
          </h2>
          <ul className="space-y-4">
            {forYou.map((t) => (
              <li key={t} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "linear-gradient(135deg, #0F1B2D, #4A6278)" }}>
                  <Check size={14} className="text-white" strokeWidth={3} />
                </span>
                <span className="font-sans text-[15px] text-foreground/85 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Não é para você */}
        <div className="rounded-lg p-8 md:p-11 border border-border" style={{ background: "#EFEAF4" }}>
          <span className="eyebrow text-scandia-purple mb-4 block">Esse serviço não é para você se…</span>
          <h3 className="font-serif text-foreground leading-[1.2] mb-7" style={{ fontSize: "clamp(24px, 2.6vw, 32px)", fontWeight: 500 }}>
            A prioridade é o menor preço, acima de tudo
          </h3>
          <ul className="space-y-4 mb-8">
            {notForYou.map((t) => (
              <li key={t} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-scandia-purple/15 flex items-center justify-center mt-0.5">
                  <X size={14} className="text-scandia-purple" strokeWidth={3} />
                </span>
                <span className="font-sans text-[16px] text-foreground/90 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] text-foreground/80 italic font-sans leading-relaxed">
            A Scandia Travel trabalha com um número limitado de clientes por período para garantir
            atenção individualizada em cada viagem.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForWhoSection;
