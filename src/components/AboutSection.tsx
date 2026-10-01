import geirangerImg from "@/assets/sobre-geiranger.jpg";

const AboutSection = () => (
  <section id="sobre" className="section-padding bg-offwhite">
    <div className="container max-w-[1200px] grid items-center gap-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] md:gap-14 lg:gap-24">
      <figure className="relative min-w-0 w-full">
        <img
          src={geirangerImg}
          alt="Geirangerfjord entre montanhas na Noruega"
          className="w-full aspect-[4/4.2] object-cover rounded-[5px] md:aspect-[4/5]"
          loading="lazy"
        />
        <figcaption className="font-sans text-xs tracking-[0.12em] uppercase text-foreground/60 mt-4">
          Geirangerfjord · Noruega
        </figcaption>
      </figure>
      <div className="min-w-0">
        <span className="eyebrow text-scandia-teal mb-6 block">Especialistas no norte da Europa</span>
        <h2 className="max-w-[560px] font-serif text-[clamp(2.8rem,5vw,4.8rem)] font-medium leading-[1.03] text-[#0F1B2D] [text-wrap:balance]">Viagens desenhadas por quem <em>conhece o caminho.</em></h2>
        <div className="mt-8 space-y-5 border-l border-[#C9A24B] pl-5 text-[16px] leading-[1.8] text-foreground/75 md:pl-7">
          <p>Há dez anos nos dedicamos à Escandinávia. Nossa especialista morou na Noruega e conhece pessoalmente Islândia, Noruega, Suécia e Finlândia.</p>
          <p>Essa vivência ajuda a escolher mais que lugares bonitos: a estação certa, as distâncias viáveis e experiências locais que respeitam o ritmo de quem viaja.</p>
          <p>Escutamos primeiro. Depois, desenhamos e acompanhamos sua viagem do planejamento ao retorno, para que você viva o destino sem carregar o peso de cada decisão.</p>
        </div>
      </div>
    </div>
  </section>
);
export default AboutSection;
