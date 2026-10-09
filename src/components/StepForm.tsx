import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import auroraImg from "@/assets/hero-islandia-aurora.jpg";

declare global {
  interface Window {
    SCANDIA_CONFIG?: { agencyName: string; whatsapp: string; whatsappMessage: string; metaPixelId: string; ga4MeasurementId: string; trackingEnabled: boolean };
    fbq?: (...args: unknown[]) => void;
  }
}

const steps = [
  { label: "Destino", title: "Para onde você sonha ir?", hint: "Escolha o destino que mais combina com o momento de vocês.", options: ["Islândia", "Noruega", "Suécia", "Finlândia", "Combinar destinos", "Quero orientação"] },
  { label: "Experiência", title: "O que mais deseja viver?", hint: "Vamos usar sua escolha como ponto de partida para o roteiro.", options: ["Aurora e inverno", "Fiordes e natureza", "Cultura e cidades", "Um pouco de tudo"] },
  { label: "Época", title: "Quando imagina viajar?", hint: "Uma previsão já nos ajuda a pensar na melhor temporada.", options: ["Nos próximos 6 meses", "Entre 6 e 12 meses", "Daqui a mais de 1 ano", "Ainda não defini"] },
  { label: "Companhia", title: "Com quem você vai viajar?", hint: "O ritmo da viagem começa pelas pessoas que vão vivê-la.", options: ["Em casal", "Com pequena família", "Sozinho(a)", "Outro formato"] },
] as const;

const StepForm = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const onContact = step === steps.length;

  const select = (value: string) => {
    setAnswers((current) => current.map((answer, index) => index === step ? value : answer));
    setErro("");
    setStep((current) => current + 1);
  };

  const back = () => { setErro(""); setStep((current) => Math.max(0, current - 1)); };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setErro("");

    const nomeTrim = nome.trim();
    const digits = phone.replace(/\D/g, "");
    const phoneIntl = /^\d{10,11}$/.test(digits) ? `55${digits}` : /^55\d{10,11}$/.test(digits) ? digits : "";
    if (!nomeTrim) { setErro("Informe seu nome para continuarmos."); return; }
    if (!phoneIntl) { setErro("Informe um WhatsApp válido com DDD."); return; }

    const config = window.SCANDIA_CONFIG;
    if (!config?.whatsapp || !/^\d{12,15}$/.test(config.whatsapp)) {
      setErro("O WhatsApp da agência está indisponível no momento. Tente novamente mais tarde."); return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crm/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeTrim,
          whatsapp: phoneIntl,
          destino: answers[0],
          datas: answers[2],
          observacoes: `Experiência desejada: ${answers[1]}\nCompanhia: ${answers[3]}`,
          origem: "Landing Page Scandia Travel",
        }),
      });
      if (!response.ok) throw new Error("CRM unavailable");

      const eventId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (typeof window.fbq === "function") window.fbq("track", "Lead", {}, { eventID: eventId });
      if (config.trackingEnabled) {
        fetch("/tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            event_name: "Lead",
            event_id: eventId,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: window.location.href,
            user_data: {
              ph: phoneIntl,
              fn: nomeTrim.split(" ")[0].toLowerCase(),
              ln: nomeTrim.split(" ").slice(1).join(" ").toLowerCase() || undefined,
            },
          }),
        }).catch(() => {});
      }

      const message = [
        config.whatsappMessage,
        "",
        `Nome: ${nomeTrim}`,
        `Meu WhatsApp: +${phoneIntl}`,
        `Destino: ${answers[0]}`,
        `Experiência: ${answers[1]}`,
        `Época: ${answers[2]}`,
        `Viajantes: ${answers[3]}`,
      ].join("\n");
      window.location.assign(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`);
    } catch {
      setErro("Não foi possível registrar seu pedido agora. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  return (
    <section id="formulario" className="relative scroll-mt-20 overflow-hidden bg-[#0F1B2D] px-5 py-16 md:px-8 md:py-28 lg:px-16">
      <img src={auroraImg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2D]/95 to-[#0F1B2D]/65" />
      <div className="container relative max-w-[1120px] grid lg:grid-cols-[0.8fr_1.2fr] gap-9 lg:gap-16 items-center">
        <div className="text-white">
          <span className="eyebrow text-[#C9A24B] block mb-5">Sua viagem começa aqui</span>
          <h2 className="font-serif font-medium text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] max-w-[550px]">Conte como imagina viver o norte.</h2>
          <p className="mt-6 max-w-[470px] text-[16px] leading-relaxed text-white/80">Quatro escolhas rápidas ajudam a entender o destino, a época e o ritmo que combinam com você. Depois, conversamos sobre os próximos passos.</p>
          <p className="mt-8 hidden lg:block text-sm text-[#C9A24B]">Islândia · Noruega · Suécia · Finlândia</p>
        </div>

        <div className="min-w-0 rounded-2xl bg-[#F4F1EC] p-6 sm:p-8 md:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4A6278]">{onContact ? "Último passo · contato" : `Etapa ${step + 1} de ${steps.length} · ${steps[step].label}`}</span>
            <span className="text-xs font-semibold text-[#4A6278]">{Math.round((step / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#0F1B2D]/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step} aria-label="Progresso do planejamento">
            <div className="h-full rounded-full bg-[#C9A24B] transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
          </div>

          {onContact ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <h3 className="font-serif text-[32px] md:text-[39px] leading-tight text-[#0F1B2D]">Agora vamos conversar.</h3>
              <p className="mt-3 mb-6 text-[15px] leading-relaxed text-[#14181D]/70">Deixe seu nome e WhatsApp. Seu pedido será registrado e uma mensagem com suas escolhas ficará pronta para enviar à Scandia.</p>
              <label htmlFor="lead-name" className="block text-sm font-semibold text-[#0F1B2D] mb-2">Seu nome</label>
              <input id="lead-name" type="text" value={nome} onChange={(event) => setNome(event.target.value)} autoComplete="name" maxLength={120} className="w-full rounded-lg border border-[#0F1B2D]/20 bg-white px-4 py-3.5 text-[#14181D] focus:outline-none focus:ring-2 focus:ring-[#4A6278]" placeholder="Como podemos chamar você?" />
              <label htmlFor="lead-phone" className="block text-sm font-semibold text-[#0F1B2D] mb-2 mt-5">Seu WhatsApp com DDD</label>
              <input id="lead-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" maxLength={20} className="w-full rounded-lg border border-[#0F1B2D]/20 bg-white px-4 py-3.5 text-[#14181D] focus:outline-none focus:ring-2 focus:ring-[#4A6278]" placeholder="(61) 99999-9999" />
              {erro && <p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 mt-7">
                <button type="button" onClick={back} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-[#4A6278] hover:bg-[#0F1B2D]/5 disabled:opacity-50"><ArrowLeft size={16} /> Voltar</button>
                <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0F1B2D] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#4A6278] disabled:opacity-60 transition-colors">{loading ? "Registrando pedido..." : "Continuar no WhatsApp"}<ArrowRight size={16} /></button>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-[#14181D]/60">Seus dados serão registrados no CRM da Scandia Travel para que a equipe possa entrar em contato. Você confirma o envio da mensagem no WhatsApp.</p>
            </form>
          ) : (
            <div className="mt-8">
              <h3 className="font-serif text-[32px] md:text-[39px] leading-tight text-[#0F1B2D]">{steps[step].title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#14181D]/70">{steps[step].hint}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-7" role="group" aria-label={steps[step].title}>
                {steps[step].options.map((option) => {
                  const selected = answers[step] === option;
                  return <button key={option} type="button" onClick={() => select(option)} aria-pressed={selected} className={`flex min-h-[70px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition-colors ${selected ? "border-[#0F1B2D] bg-[#0F1B2D] text-white" : "border-[#0F1B2D]/15 bg-white text-[#0F1B2D] hover:border-[#4A6278]"}`}>
                    <span>{option}</span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#C9A24B] bg-[#C9A24B] text-[#0F1B2D]" : "border-[#4A6278]/40"}`}>{selected && <Check size={13} strokeWidth={3} />}</span>
                  </button>;
                })}
              </div>
              {step > 0 && <button type="button" onClick={back} className="mt-7 inline-flex items-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold text-[#4A6278] hover:bg-[#0F1B2D]/5"><ArrowLeft size={16} /> Voltar</button>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StepForm;
