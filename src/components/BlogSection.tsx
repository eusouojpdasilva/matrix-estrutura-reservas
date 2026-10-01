import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import icelandImg from "@/assets/destino-islandia.jpg";

type Article = {
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
};

const topics = [
  { number: "01", title: "Quando viajar", detail: "Luz, clima e estação certa para o que você quer viver." },
  { number: "02", title: "Por onde começar", detail: "Destinos e trajetos que fazem sentido no seu tempo." },
  { number: "03", title: "Viajar com calma", detail: "Natureza, cultura e conforto no mesmo roteiro." },
];

const BlogSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/loja/api/articles?limit=3", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setArticles(data.filter((item): item is Article =>
            typeof item?.title === "string" && typeof item?.slug === "string"
          ).slice(0, 3));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section id="blog" className="section-padding bg-[#F4F1EC]">
      <div className="container max-w-[1200px]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-[720px]">
            <span className="eyebrow text-[#4A6278] block mb-4">Caderno de viagem</span>
            <h2 className="font-serif text-[#0F1B2D] text-[clamp(2.25rem,5vw,4rem)] leading-[1.06] font-medium">
              O norte começa antes da partida.
            </h2>
            <p className="mt-5 text-[16px] md:text-[18px] leading-relaxed text-[#14181D]/75">
              Ideias e orientações para escolher quando ir, o que viver e como percorrer a Islândia e a Escandinávia no seu ritmo.
            </p>
          </div>
          <a href="/loja/blog/" className="inline-flex items-center gap-2 self-start lg:self-auto whitespace-nowrap border-b border-[#0F1B2D] pb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#0F1B2D] hover:text-[#4A6278] hover:border-[#4A6278] transition-colors">
            Visitar o blog <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(15,27,45,0.07)]">
          <div className="relative min-h-[300px] md:min-h-[440px] overflow-hidden">
            <img src={icelandImg} alt="Paisagem de cascata e montanhas na Islândia" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/70 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 text-white text-[12px] font-semibold uppercase tracking-[0.18em]">Islândia · natureza em outra escala</p>
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12">
            {articles.length > 0 ? (
              <>
                <span className="eyebrow text-[#4A6278] mb-3">Últimas histórias</span>
                <div className="divide-y divide-[#0F1B2D]/10">
                  {articles.map((article) => (
                    <a key={article.slug} href={`/loja/blog/${encodeURIComponent(article.slug)}`} className="group block py-5 first:pt-0 last:pb-0">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-serif text-[25px] md:text-[29px] leading-tight text-[#0F1B2D] group-hover:text-[#4A6278] transition-colors">{article.title}</span>
                        <ArrowUpRight size={18} className="shrink-0 mt-1 text-[#C9A24B]" aria-hidden="true" />
                      </span>
                      {article.excerpt && <span className="mt-2 block text-sm leading-relaxed text-[#14181D]/65 line-clamp-2">{article.excerpt}</span>}
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow text-[#4A6278] mb-3">Em pauta no blog</span>
                <h3 className="font-serif text-[31px] md:text-[38px] leading-tight text-[#0F1B2D] mb-5">Boas escolhas fazem a viagem.</h3>
                <div className="divide-y divide-[#0F1B2D]/10">
                  {topics.map((topic) => (
                    <div key={topic.number} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="text-xs font-bold text-[#C9A24B] pt-1">{topic.number}</span>
                      <div>
                        <h4 className="font-sans text-[15px] font-bold text-[#0F1B2D]">{topic.title}</h4>
                        <p className="text-sm text-[#14181D]/65 leading-relaxed mt-1">{topic.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#14181D]/55 mt-6">Os primeiros artigos estão em preparação.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
