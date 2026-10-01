CREATE TABLE IF NOT EXISTS guias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT NOT NULL,
  descricao TEXT,
  preco     TEXT DEFAULT 'Em breve',
  imagem    TEXT,
  status    TEXT DEFAULT 'coming_soon',
  destaque  INTEGER DEFAULT 0,
  link      TEXT,
  ordem     INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO guias (nome, descricao, preco, imagem, status, destaque, link, ordem) VALUES
('Itália Autoral 2026', 'Roma, Florença, Veneza, Amalfi e Toscana além do óbvio. Roteiros estratégicos, restaurantes autênticos e os segredos que só quem conhece de verdade sabe.', 'R$ 97,00', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2596&auto=format&fit=crop', 'active', 1, '#', 1),
('França Profunda', 'Paris e muito além: Provence, Loire, Bordeaux e os vilarejos que a maioria dos turistas nunca encontra. Cultura, gastronomia e arte em cada detalhe.', 'Em breve', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2673&auto=format&fit=crop', 'coming_soon', 0, NULL, 2),
('Portugal Essencial', 'Lisboa, Porto, Alentejo e o Douro. Um guia para quem quer viver Portugal como um local, com ritmo, sabor e autenticidade.', 'Em breve', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=2670&auto=format&fit=crop', 'coming_soon', 0, NULL, 3),
('Espanha além de Madrid', 'Sevilha, Barcelona, San Sebastián e a Espanha que surpreende. Tapas, flamenco, arquitetura e paisagens que ficam para sempre na memória.', 'Em breve', 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?q=80&w=2670&auto=format&fit=crop', 'coming_soon', 0, NULL, 4);
