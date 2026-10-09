const items = ["Islândia", "Noruega", "Suécia", "Finlândia"];
const loop = [...items, ...items, ...items];

const DestinationsStrip = () => {
  return (
    <section aria-label="Destinos de especialidade da Scandia Travel" className="overflow-hidden py-5" style={{ background: "#4A6278" }}>
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {loop.map((country, i) => (
          <div key={`${country}-${i}`} className="flex items-center px-8">
            <span
              className="italic text-white"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "20px", letterSpacing: "0.18em", fontWeight: 600 }}
            >
              {country}
            </span>
            <span className="ml-8 text-scandia-cream text-xl" aria-hidden>·</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DestinationsStrip;
