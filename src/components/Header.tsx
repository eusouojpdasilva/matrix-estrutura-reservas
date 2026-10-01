import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
const logoscandia = "/brand/logo-dark.png";

const links: Array<[string, string]> = [
  ["Como funciona", "como-funciona"],
  ["Destinos", "destinos"],
  ["Sobre", "sobre"],
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-slide-down ${
        scrolled ? "py-3 shadow-lg" : "py-5"
      }`}
      style={{
        background: scrolled ? "rgba(15,27,45, 0.88)" : "rgba(15,27,45, 0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="container flex items-center justify-between">
        <button onClick={() => scrollTo("hero")} aria-label="Scandia Travel" className="flex items-center gap-3">
          <img src={logoscandia} alt="" className="h-12 md:h-14 w-auto rounded-sm" />
          <span className="font-serif text-offwhite text-lg md:text-xl tracking-[0.18em] leading-none text-left">
            SCANDIA<span className="block font-sans text-[9px] tracking-[0.43em] mt-1">TRAVEL</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-10">
          {links.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="nav-link text-[14px] font-semibold uppercase tracking-[0.18em] text-offwhite hover:text-scandia-cream"
            >
              {label}
            </button>
          ))}
          <button onClick={() => scrollTo("formulario")} className="btn-brand !py-2.5 !px-5 !text-[12px]">
            Planejar viagem
          </button>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-offwhite p-1"
          aria-label="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 mx-4 rounded-lg border border-scandia-purple/30" style={{ background: "rgba(15, 8, 32, 0.96)", backdropFilter: "blur(16px)" }}>
          <nav className="flex flex-col py-4 px-5 gap-3">
            {links.map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-left text-[14px] font-semibold uppercase tracking-[0.18em] text-offwhite hover:text-scandia-cream py-2"
              >
                {label}
              </button>
            ))}
            <button onClick={() => scrollTo("formulario")} className="btn-brand mt-2 !py-3">
              Planejar viagem
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
