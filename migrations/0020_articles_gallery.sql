-- Adiciona galeria de fotos nos artigos do blog
-- Armazenado como JSON array de strings (URLs)
ALTER TABLE articles ADD COLUMN gallery TEXT;
