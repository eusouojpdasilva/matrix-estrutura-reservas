const logoscandia = "/brand/logo-dark.png";

const CONTACT_LINK = "/#formulario";

const FooterCTA = () => {
  return (
    <footer style={{ background: "#0F1B2D" }}>
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 py-10">
        <img src={logoscandia} alt="Scandia Travel" className="h-7 w-auto opacity-90" />
        <p className="text-[13px] font-sans text-scandia-cream">
          © {new Date().getFullYear()} Scandia Travel. Todos os direitos reservados.
        </p>
      </div>

      <div
        className="border-t border-white/10 py-4"
        style={{ background: "rgba(0,0,0,.18)" }}
      >
        <p className="text-center text-[12px] font-sans" style={{ color: "rgba(255,255,255,.55)" }}>
          Planeje sua próxima viagem ·{" "}
          <a
            href={CONTACT_LINK}
            style={{ color: "rgba(255,255,255,.8)" }}
            className="underline underline-offset-2 hover:text-white transition-colors"
          >
            Entre em contato
          </a>
          <span aria-hidden="true"> · </span>
          <a href="/loja/blog/" className="underline underline-offset-2 hover:text-white transition-colors" style={{ color: "rgba(255,255,255,.8)" }}>Blog de viagens</a>
        </p>
      </div>
    </footer>
  );
};

export default FooterCTA;
