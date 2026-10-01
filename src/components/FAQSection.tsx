import { Plus } from "lucide-react";

const questions = [
  {
    question: "Quais destinos a Scandia Travel atende?",
    answer: "Criamos viagens para Islândia, Noruega, Suécia e Finlândia. Podemos combinar destinos quando o tempo disponível e o ritmo da viagem permitirem.",
  },
  {
    question: "Qual é a melhor época para viajar?",
    answer: "Depende do que você quer viver: paisagens de verão, cidades, fiordes ou noites de inverno. A aurora boreal depende de condições naturais e nunca pode ser garantida; ajudamos você a escolher a época com expectativas realistas.",
  },
  {
    question: "As viagens são em grupo?",
    answer: "A proposta é um roteiro personalizado para casais e pequenas famílias, com tempo para apreciar cada lugar. Definimos o percurso a partir dos seus interesses, conforto desejado e disponibilidade.",
  },
  {
    question: "Como funciona a consultoria?",
    answer: "Começamos com uma conversa para entender seu perfil. Depois desenhamos um roteiro de até 15 dias, considerando destinos, temporada, deslocamentos e experiências. A consultoria custa R$ 1.500 e esse valor é abatido se você reservar a viagem com a Scandia Travel.",
  },
];

const FAQSection = () => (
  <section id="perguntas" className="section-padding bg-white">
    <div className="container max-w-[1000px] grid md:grid-cols-[0.8fr_1.2fr] gap-10 md:gap-20">
      <div>
        <span className="eyebrow text-[#4A6278] block mb-4">Antes de partir</span>
        <h2 className="font-serif text-[#0F1B2D] text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-medium">Perguntas frequentes</h2>
        <p className="text-[#14181D]/70 leading-relaxed mt-5">O essencial para começar a planejar uma viagem ao norte com tranquilidade.</p>
      </div>
      <div className="border-t border-[#0F1B2D]/15">
        {questions.map(({ question, answer }) => (
          <details key={question} className="group border-b border-[#0F1B2D]/15">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer text-[#0F1B2D] list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[16px] md:text-[18px] font-semibold leading-snug">{question}</span>
              <Plus size={19} className="shrink-0 text-[#C9A24B] transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="pb-6 pr-8 text-[15px] leading-relaxed text-[#14181D]/75">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default FAQSection;
