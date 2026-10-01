import { useState } from "react";

declare global {
  interface Window {
    SCANDIA_CONFIG?: { agencyName: string; whatsapp: string; whatsappMessage: string; metaPixelId: string; ga4MeasurementId: string; trackingEnabled: boolean };
    fbq?: (...args: unknown[]) => void;
  }
}



const StepForm = () => {
  const [nome, setNome]       = useState("");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    const nomeTrim  = nome.trim();
    const phoneTrim = phone.replace(/\D/g, "");

    if (!nomeTrim) { setErro("Por favor, informe seu nome."); return; }
    if (phoneTrim.length < 10) { setErro("Por favor, informe um WhatsApp válido."); return; }

    const config = window.SCANDIA_CONFIG;
    if (!config?.whatsapp || !/^[1-9][0-9]{9,14}$/.test(config.whatsapp)) {
      setErro("O atendimento online estará disponível em breve."); return;
    }
    setLoading(true);

    const eventId =
      (crypto.randomUUID && crypto.randomUUID()) ||
      (Date.now() + "-" + Math.random().toString(36).slice(2));

    // 1. CRM lead capture — fire-and-forget, não bloqueia o redirect
    fetch("/api/crm/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        nome:     nomeTrim,
        whatsapp: phoneTrim,
        origem:   "Landing Page",
      }),
    }).catch(() => {});

    // 2. Meta pixel Lead (browser-side)
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Lead", { phone: phoneTrim }, { eventID: eventId });
    }

    // 3. CAPI server-side Lead (com phone para Advanced Matching)
    if (window.SCANDIA_CONFIG?.trackingEnabled) fetch("/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name:       "Lead",
        event_id:         eventId,
        event_time:       Math.floor(Date.now() / 1000),
        event_source_url: window.location.href,
        user_data: {
          ph: phoneTrim,
          fn: nomeTrim.split(" ")[0].toLowerCase(),
          ln: nomeTrim.split(" ").slice(1).join(" ").toLowerCase() || undefined,
        },
      }),
    }).catch(() => {});

    // 4. Abre WhatsApp
    window.open(
      `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(config.whatsappMessage)}`,
      "_blank",
      "noopener"
    );

    setLoading(false);
  };

  return (
    <section id="formulario" className="section-padding bg-secondary">
      <div className="container max-w-lg text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
          Solicite uma conversa antes da sua viagem
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          A Scandia Travel conduz um número limitado de planejamentos por período. Preencha abaixo para iniciar uma conversa e verificar a disponibilidade.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-5 py-3.5 rounded-full border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0F1B2D]/40 transition"
            autoComplete="name"
          />
          <input
            type="tel"
            placeholder="WhatsApp (DDD + número)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-5 py-3.5 rounded-full border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0F1B2D]/40 transition"
            autoComplete="tel"
            inputMode="tel"
          />

          {erro && (
            <p className="text-sm text-red-500 text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] disabled:opacity-60 text-white font-sans font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300 active:scale-[0.98]"
          >
            <WhatsAppIcon />
            {loading ? "Aguarde..." : "Falar com a Scandia"}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-1">
            Seus dados são usados apenas para entrar em contato com você.
          </p>
        </form>
      </div>
    </section>
  );
};

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.29-.15-1.72-.85-1.98-.94-.27-.1-.46-.15-.66.15-.2.29-.76.94-.93 1.13-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.36-.02-.51-.07-.15-.66-1.59-.91-2.18-.24-.57-.48-.5-.66-.51-.17-.01-.36-.01-.56-.01-.2 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.04 2.82 1.19 3.01.15.2 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.11.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.34z"/>
    <path d="M12.02 2C6.5 2 2 6.48 2 11.98c0 1.99.53 3.85 1.55 5.5L2 22l4.65-1.5a10.1 10.1 0 0 0 5.37 1.54h.01c5.52 0 10.02-4.48 10.02-9.98A9.9 9.9 0 0 0 12.02 2zm0 18.15h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.15 1.02 1.03-3.06-.2-.32a8.14 8.14 0 0 1-1.27-4.47c0-4.53 3.7-8.22 8.24-8.22 2.2 0 4.27.86 5.83 2.41a8.14 8.14 0 0 1 2.41 5.82c0 4.53-3.7 8.16-8.35 8.16z"/>
  </svg>
);

export default StepForm;
