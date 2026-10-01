import { useReveal } from "@/hooks/useReveal";
import icelandImg from "@/assets/destino-islandia.jpg";
import norwayImg from "@/assets/destino-noruega.jpg";
import swedenImg from "@/assets/destino-suecia.jpg";
import finlandImg from "@/assets/destino-finlandia.jpg";

const destinations = [
  { name: "Islândia", detail: "Cascatas e paisagens vulcânicas", img: icelandImg, alt: "Cascata entre paredões cobertos de musgo na Islândia" },
  { name: "Noruega", detail: "Fiordes e rotas panorâmicas", img: norwayImg, alt: "Ponte e montanhas das Ilhas Lofoten, na Noruega" },
  { name: "Suécia", detail: "Cidades e cultura local", img: swedenImg, alt: "Casario histórico à beira d'água em Estocolmo, Suécia" },
  { name: "Finlândia", detail: "Lapônia e inverno com calma", img: finlandImg, alt: "Cabana à beira de lago cercada por floresta nevada na Finlândia" },
];

const DestinationsGrid = () => {
  return (
    <section id="destinos" className="section-padding" style={{ background: "#0F1B2D" }}>
      <div className="container max-w-[1200px]">
        <div className="max-w-[760px] mb-12">

          <h2 className="font-serif text-offwhite leading-[1.1] mb-4" style={{ fontSize: "clamp(34px, 4.5vw, 56px)", fontWeight: 500 }}>
            Quatro destinos.{" "}
            <em className="text-scandia-cream" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Infinitas formas de viver.</em>
          </h2>
          <p className="font-sans font-light text-offwhite" style={{ fontSize: "18px", lineHeight: 1.65 }}>
            Da paisagem vulcânica da Islândia aos fiordes noruegueses, da cultura
            sueca ao inverno da Lapônia finlandesa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {destinations.map((d, i) => <Card key={d.name} d={d} index={i} />)}
        </div>

        <p
          className="font-sans font-light text-offwhite mt-10 max-w-[860px]"
          style={{ fontSize: "16px", lineHeight: 1.7 }}
        >
          <span className="text-scandia-cream font-medium">A melhor época faz parte do roteiro:</span>{" "}
          aurora boreal, sol da meia-noite, estrada pelos fiordes ou cidades nórdicas
          com calma — cada viagem pede uma escolha diferente.
        </p>
      </div>
    </section>
  );
};

const Card = ({ d, index }: { d: typeof destinations[number]; index: number }) => {
  const { ref, visible } = useReveal();
  return (
    <article
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} group relative overflow-hidden h-[320px]`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <img
        src={d.img}
        alt={d.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 transition-all duration-500"
           style={{ background: "linear-gradient(180deg, transparent 30%, rgba(15,27,45,0.88) 100%)" }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: "rgba(15,27,45,0.35)" }} />

      <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 group-hover:-translate-y-2">
        <h3 className="font-serif text-offwhite" style={{ fontSize: "26px", fontWeight: 500 }}>{d.name}</h3>
        <p className="font-sans text-[13px] text-offwhite/85 leading-relaxed mt-1">{d.detail}</p>
      </div>
    </article>
  );
};

export default DestinationsGrid;
