import { useReveal } from "@/hooks/useReveal";

const horizontalVideos: { id: string; title: string }[] = [];

const shortsVideos: { id: string; title: string }[] = [];

// Parâmetros que mantêm apenas play/pause visíveis e removem branding/sugestões.
const embedParams =
  "?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0&disablekb=1&controls=1";

const VideoCard = ({
  id,
  title,
  index,
  vertical = false,
}: {
  id: string;
  title: string;
  index: number;
  vertical?: boolean;
}) => {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} relative overflow-hidden rounded-md shadow-xl bg-black`}
      style={{
        aspectRatio: vertical ? "9 / 16" : "16 / 9",
        border: "1px solid rgba(244,241,236,0.18)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}${embedParams}`}
        title={title}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full"
        frameBorder={0}
      />
    </div>
  );
};

const TravelersVideos = () => {
  if (!horizontalVideos.length && !shortsVideos.length) return null;
  return (
    <section
      id="viajantes"
      className="section-padding"
      style={{ background: "linear-gradient(180deg, #4A6278 0%, #0F1B2D 100%)" }}
    >
      <div className="container max-w-[1200px]">
        <div className="max-w-[760px] mb-12 md:mb-16">
          <span className="eyebrow text-scandia-cream mb-5 block">Histórias reais</span>
          <h2
            className="font-serif text-offwhite leading-[1.1]"
            style={{ fontSize: "clamp(34px, 4.5vw, 56px)", fontWeight: 500 }}
          >
            Alguns viajantes{" "}
            <em className="text-scandia-cream" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              que atendi.
            </em>
          </h2>
        </div>

        {/* Vídeos horizontais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-14">
          {horizontalVideos.map((v, i) => (
            <VideoCard key={v.id} id={v.id} title={v.title} index={i} />
          ))}
        </div>

        {/* Shorts (vertical) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-[720px] mx-auto">
          {shortsVideos.map((v, i) => (
            <VideoCard
              key={v.id}
              id={v.id}
              title={v.title}
              index={i + horizontalVideos.length}
              vertical
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelersVideos;
