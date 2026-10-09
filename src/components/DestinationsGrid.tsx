import { ArrowUpRight } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import icelandImg from "@/assets/destino-islandia.jpg";
import norwayImg from "@/assets/destino-noruega.jpg";
import swedenImg from "@/assets/destino-suecia.jpg";
import finlandImg from "@/assets/destino-finlandia.jpg";

const destinations = [
  { name: "Islândia", detail: "Cascatas, vulcões e horizontes sem fim", img: icelandImg, alt: "Cascata entre paredões cobertos de musgo na Islândia", layout: "md:col-span-2 lg:col-span-5 lg:row-span-2" },
  { name: "Noruega", detail: "Fiordes, estradas e paisagens grandiosas", img: norwayImg, alt: "Ponte e montanhas das Ilhas Lofoten, na Noruega", layout: "lg:col-span-7" },
  { name: "Suécia", detail: "Cidades, design e cultura local", img: swedenImg, alt: "Casario histórico à beira d'água em Estocolmo, Suécia", layout: "lg:col-span-4" },
  { name: "Finlândia", detail: "Florestas, lagos e inverno sereno", img: finlandImg, alt: "Cabana à beira de lago cercada por floresta nevada na Finlândia", layout: "lg:col-span-3" },
];

const DestinationsGrid = () => (
  <section id="destinos" className="section-padding overflow-hidden bg-[#0F1B2D] text-white">
    <div className="container max-w-[1200px]">
      <div className="mb-10 grid items-end gap-6 md:mb-14 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-12">
        <div>
          <span className="eyebrow mb-5 block text-[#C9A24B]">Seu próximo horizonte</span>
          <h2 className="max-w-[740px] font-serif text-[clamp(2.7rem,5vw,4.7rem)] font-medium leading-[1.02] [text-wrap:balance]">
            Quatro destinos. <em className="text-[#F0D794]">Infinitas formas de viver.</em>
          </h2>
        </div>
        <p className="max-w-[360px] text-[16px] leading-[1.75] text-white/75">
          Da paisagem vulcânica da Islândia aos fiordes noruegueses, da cultura sueca ao inverno da Lapônia finlandesa. Cada escolha desenha uma viagem diferente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:auto-rows-[260px] lg:grid-cols-12">
        {destinations.map((destination, index) => <DestinationCard key={destination.name} destination={destination} index={index} />)}
      </div>

      <div className="mt-9 flex flex-col gap-3 border-t border-white/20 pt-7 md:flex-row md:items-center md:justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[.19em] text-[#C9A24B]">A estação faz parte do destino</span>
        <p className="max-w-[790px] text-[15px] leading-relaxed text-white/70">
          Aurora boreal, sol da meia-noite, estrada pelos fiordes ou cidades nórdicas com calma: <strong className="font-semibold text-white">o melhor roteiro começa pela época certa.</strong>
        </p>
      </div>
    </div>
  </section>
);

const DestinationCard = ({ destination, index }: { destination: typeof destinations[number]; index: number }) => {
  const { ref, visible } = useReveal();
  return (
    <a
      href="#formulario"
      aria-label={`Planejar viagem para ${destination.name}`}
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} group relative isolate min-w-0 overflow-hidden rounded-[5px] h-[340px] md:h-[350px] lg:h-auto ${destination.layout}`}
      style={{ transitionDelay: `${index * 75}ms` }}
    >
      <img src={destination.img} alt={destination.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.055] group-hover:saturate-[1.15] motion-reduce:transition-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071728]/90 via-[#071728]/20 to-[#071728]/5 transition-colors duration-500 group-hover:from-[#071728]/95" />
      <div className="absolute inset-4 border border-white/25 transition-all duration-500 group-hover:inset-5 group-hover:border-[#F0D794]/65 motion-reduce:transition-none" aria-hidden="true" />
      <div className="absolute left-8 top-8 flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-white/85">
        <span className="text-[#F0D794]">0{index + 1}</span>
        <span className="h-px w-6 bg-white/60" aria-hidden="true" />
        NORTE DA EUROPA
      </div>
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[clamp(2rem,3vw,3.1rem)] font-medium leading-none text-white">{destination.name}</h3>
          <p className="mt-2 max-w-[310px] text-[13px] leading-relaxed text-white/80">{destination.detail}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 text-white transition-colors group-hover:border-[#C9A24B] group-hover:bg-[#C9A24B] group-hover:text-[#0F1B2D]" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </a>
  );
};

export default DestinationsGrid;
