import { Check, X } from "lucide-react";

const forYou = [
  "Você sonha com Islândia ou Escandinávia e quer acertar a época da viagem",
  "Já pesquisou bastante, mas ainda não sabe que trajeto realmente funciona",
  "Prefere viajar com calma, sem trocar de hotel ou cidade todos os dias",
  "Valoriza natureza, cultura local, bons restaurantes e conforto sem ostentação",
  "Quer apoio especializado para as reservas e para os imprevistos no destino",
  "Viaja em casal ou em uma pequena família e busca uma experiência feita para vocês",
];

const notForYou = [
  "Você prefere uma excursão com roteiro e horários fixos",
  "Quer decidir deslocamentos e hospedagens apenas quando chegar",
  "A única prioridade é encontrar a opção mais barata",
  "Prefere pesquisar, reservar e resolver imprevistos sem apoio",
];

const ForWhoSection = () => {
  return (
    <section className="section-padding" style={{ background: "#FFFFFF" }}>
      <div className="container max-w-[1100px] grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Para você */}
        <div className="bg-white rounded-lg p-8 md:p-11 border border-border shadow-sm">
          <span className="eyebrow text-scandia-purple mb-4 block">Esse serviço é para você se…</span>
          <h2 className="font-serif text-foreground leading-[1.15] mb-7" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 500 }}>
            Você quer viajar no{" "}
            <em className="text-scandia-purple" style={{ fontFamily: '"Cormorant Garamond", serif' }}>seu próprio ritmo</em>
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
        <div className="rounded-lg p-8 md:p-11 border border-border" style={{ background: "#F4F1EC" }}>
          <span className="eyebrow text-scandia-purple mb-4 block">Esse serviço não é para você se…</span>
          <h3 className="font-serif text-foreground leading-[1.2] mb-7" style={{ fontSize: "clamp(24px, 2.6vw, 32px)", fontWeight: 500 }}>
            Você procura outro estilo de viagem
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
            Nossa consultoria é individual: cada escolha parte do seu perfil e da época
            em que a viagem vai acontecer.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForWhoSection;
