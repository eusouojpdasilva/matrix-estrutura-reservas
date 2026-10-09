import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import icelandImg from "@/assets/hero-islandia-aurora.jpg";
import geirangerImg from "@/assets/sobre-geiranger.jpg";
import lofotenImg from "@/assets/cta-lofoten.jpg";

const scenes = [
  { image: icelandImg, place: "Islândia", detail: "Sob a aurora boreal" },
  { image: geirangerImg, place: "Noruega", detail: "Geirangerfjord" },
  { image: lofotenImg, place: "Ilhas Lofoten", detail: "Luz do norte" },
];

const HeroSection = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % scenes.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const scrollToForm = () => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });
  const scrollToDestinations = () => document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative isolate flex min-h-[760px] flex-col justify-end overflow-hidden bg-[#0F1B2D] text-white lg:min-h-screen">
      <div className="absolute inset-0" aria-hidden="true">
        {scenes.map((scene, index) => (
          <img
            key={scene.place}
            src={scene.image}
            alt=""
            loading="eager"
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className={`hero-scene absolute inset-0 h-full w-full object-cover ${active === index ? "is-active" : ""}`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,34,.88)_0%,rgba(8,20,34,.58)_48%,rgba(8,20,34,.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,20,34,.78)_0%,transparent_31%,transparent_68%,rgba(8,20,34,.24)_100%)]" />
        <div className="hero-grain absolute inset-0 opacity-[.13]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-5 pb-8 pt-40 sm:px-8 md:pb-10 md:pt-48 lg:px-12">
        <div className="grid min-w-0 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
          <div className="max-w-[790px]">
            <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8C779] sm:text-[11px]">
              <span className="h-px w-8 shrink-0 bg-[#C9A24B]" aria-hidden="true" />
              Consultoria especializada em Islândia e Escandinávia
            </div>
            <h1 className="font-serif text-[clamp(2.8rem,6.5vw,6.1rem)] font-medium leading-[.98] tracking-[-.025em] [text-wrap:balance]">
              A Escandinávia pede mais que um roteiro.
              <span className="mt-2 block italic text-[#F0D794]">Pede as escolhas certas.</span>
            </h1>
            <p className="mt-7 max-w-[615px] text-[16px] leading-[1.75] text-white/88 sm:text-[18px]">
              Para casais e pequenas famílias que querem viver Islândia, Noruega, Suécia e Finlândia com <strong className="font-semibold text-white">profundidade, conforto e tempo para aproveitar.</strong> Cuidamos da estação, do ritmo e de cada conexão.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button onClick={scrollToForm} className="group inline-flex min-h-14 items-center justify-center gap-5 rounded-md bg-[#C9A24B] px-6 py-4 text-[12px] font-bold uppercase tracking-[.13em] text-[#0F1B2D] transition-colors hover:bg-[#F4F1EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Planejar minha viagem
                <ArrowUpRight size={19} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
              <span className="text-[13px] text-white/72">Comece com quatro escolhas rápidas.</span>
            </div>
          </div>

          <div className="hidden border-l border-white/30 pl-5 lg:block">
            <span className="block text-[10px] font-bold uppercase tracking-[.22em] text-[#F0D794]">Cenas do norte</span>
            <span className="mt-3 block font-serif text-[30px] leading-none">{scenes[active].place}</span>
            <span className="mt-2 block text-[13px] text-white/75">{scenes[active].detail}</span>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-7 border-t border-white/25 pt-6 md:mt-24">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4" aria-label="Escolher paisagem do destaque">
            {scenes.map((scene, index) => (
              <button
                key={scene.place}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Mostrar paisagem: ${scene.place}`}
                aria-pressed={active === index}
                className={`hero-scene-control group flex min-w-[88px] items-center gap-2 border-t-2 pt-3 text-left text-[11px] font-bold uppercase tracking-[.12em] transition-colors sm:min-w-[112px] ${active === index ? "border-[#C9A24B] text-white" : "border-white/25 text-white/60 hover:border-white/70 hover:text-white"}`}
              >
                <span className="text-[#F0D794]">0{index + 1}</span>
                <span className="truncate">{scene.place}</span>
              </button>
            ))}
          </div>
          <button onClick={scrollToDestinations} className="hidden items-center gap-3 text-[11px] font-bold uppercase tracking-[.16em] text-white/75 transition-colors hover:text-white md:inline-flex">
            Explore os destinos <ArrowDownRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
