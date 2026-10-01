import { useReveal } from "@/hooks/useReveal";
import amsterdamImg from "@/assets/destino-amsterdam.jpg";
import londresImg from "@/assets/destino-londres.jpg";
import romaImg from "@/assets/destino-roma.jpg";
import barcelonaImg from "@/assets/destino-barcelona.jpg";
import lucernaImg from "@/assets/destino-lucerna.jpg";
import portoImg from "@/assets/destino-porto.jpg";

const destinations = [
  { name: "Itália", img: romaImg },
  { name: "França", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80" },
  { name: "Espanha", img: barcelonaImg },
  { name: "Portugal", img: portoImg },
  { name: "Suíça", img: lucernaImg },
  { name: "Holanda", img: amsterdamImg },
  { name: "Inglaterra", img: londresImg },
  { name: "Bélgica", img: "https://images.unsplash.com/photo-1572886071978-7c60b5b3e506?w=1200&q=80" },
];

const DestinationsGrid = () => {
  return (
    <section id="destinos" className="section-padding" style={{ background: "#0F1B2D" }}>
      <div className="container max-w-[1200px]">
        <div className="max-w-[760px] mb-12">

          <h2 className="font-serif text-offwhite leading-[1.1] mb-4" style={{ fontSize: "clamp(34px, 4.5vw, 56px)", fontWeight: 500 }}>
            Top Destinos{" "}
            <em className="text-scandia-cream" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Mais Procurados</em>
          </h2>
          <p className="font-sans font-light text-offwhite" style={{ fontSize: "18px", lineHeight: 1.65 }}>
            Europa explorada com critério e profundidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {destinations.map((d, i) => <Card key={d.name} d={d} index={i} />)}
        </div>

        <p
          className="font-sans font-light text-offwhite mt-10 max-w-[860px]"
          style={{ fontSize: "16px", lineHeight: 1.7 }}
        >
          <span className="text-scandia-cream font-medium">Outros destinos que trabalhamos:</span>{" "}
          Áustria, Alemanha, República Tcheca, Hungria, Polônia, Croácia, Suécia, Grécia, entre outros.
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
      className={`reveal ${visible ? "is-visible" : ""} group relative overflow-hidden h-[320px] cursor-pointer`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <img
        src={d.img}
        alt={d.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 transition-all duration-500"
           style={{ background: "linear-gradient(180deg, transparent 30%, rgba(15,27,45,0.88) 100%)" }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: "rgba(15,27,45,0.35)" }} />

      <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 group-hover:-translate-y-2">
        <h3 className="font-serif text-offwhite" style={{ fontSize: "26px", fontWeight: 500 }}>{d.name}</h3>
      </div>
    </article>
  );
};

export default DestinationsGrid;
