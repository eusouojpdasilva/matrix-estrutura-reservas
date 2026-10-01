const AboutSection = () => (
  <section id="sobre" className="section-padding bg-offwhite">
    <div className="container max-w-[1100px] grid md:grid-cols-2 gap-10 md:gap-14 items-center">
      <img src="/brand/logo-light.png" alt="Scandia Travel" className="w-full max-w-md mx-auto rounded-xl" loading="lazy" />
      <div>
        <span className="eyebrow text-scandia-teal mb-4 block">Viagens além do óbvio</span>
        <h2 className="font-serif text-4xl md:text-5xl mb-6">Scandia Travel</h2>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>Transformamos o excesso de informação em um roteiro raro e personalizado, para viajantes que procuram experiências além dos destinos óbvios.</p>
          <p>O ponto de partida é você: seu ritmo, suas preferências e o que deseja viver. A partir dessa conversa, conectamos destinos, a época certa e escolhas que fazem sentido para a sua viagem.</p>
          <p>Da inspiração ao planejamento, cada detalhe recebe atenção. Menos tempo pesquisando, mais clareza para aproveitar o caminho.</p>
        </div>
      </div>
    </div>
  </section>
);
export default AboutSection;
