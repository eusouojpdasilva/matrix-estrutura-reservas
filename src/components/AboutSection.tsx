import geirangerImg from "@/assets/sobre-geiranger.jpg";

const AboutSection = () => (
  <section id="sobre" className="section-padding bg-offwhite">
    <div className="container max-w-[1100px] grid md:grid-cols-2 gap-10 md:gap-14 items-center">
      <figure className="w-full">
        <img
          src={geirangerImg}
          alt="Geirangerfjord entre montanhas na Noruega"
          className="w-full aspect-[4/3] object-cover rounded-xl"
          loading="lazy"
        />
        <figcaption className="font-sans text-xs tracking-[0.12em] uppercase text-foreground/60 mt-3">
          Geirangerfjord · Noruega
        </figcaption>
      </figure>
      <div>
        <span className="eyebrow text-scandia-teal mb-4 block">Especialistas no norte da Europa</span>
        <h2 className="font-serif text-4xl md:text-5xl mb-6">Scandia Travel</h2>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>Há dez anos nos dedicamos à Escandinávia. Nossa especialista morou na Noruega e conhece pessoalmente Islândia, Noruega, Suécia e Finlândia.</p>
          <p>Essa vivência ajuda a escolher mais que lugares bonitos: a estação certa, as distâncias viáveis e experiências locais que respeitam o ritmo de quem viaja.</p>
          <p>Escutamos primeiro. Depois, desenhamos e acompanhamos sua viagem do planejamento ao retorno, para que você viva o destino sem carregar o peso de cada decisão.</p>
        </div>
      </div>
    </div>
  </section>
);
export default AboutSection;
