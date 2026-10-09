import { describe, expect, it } from "vitest";
import { editorialArticles } from "../../content/editorial-articles.js";
import { onRequestGet as listArticles } from "../../functions/loja/api/articles.js";
import { onRequest as renderArticle } from "../../functions/loja/blog/[slug].js";

describe("artigos editoriais da Scandia", () => {
  it("lista os três artigos mesmo sem conexão com D1", async () => {
    const response = await listArticles({ env: {}, request: new Request("https://example.com/loja/api/articles?limit=3") });
    const articles = await response.json();
    expect(articles).toHaveLength(3);
    expect(articles.map((article: { slug: string }) => article.slug)).toEqual(editorialArticles.map((article) => article.slug));
  });

  it.each(editorialArticles)("renderiza $slug com foto de abertura e foto no conteúdo", async (article) => {
    const response = await renderArticle({
      params: { slug: article.slug },
      env: {},
      request: new Request(`https://example.com/loja/blog/${article.slug}`),
    });
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain(article.cover_image);
    expect(html).toContain('class="article-figure"');
    expect(html).toContain('class="article-sources"');
    expect(html).toContain(article.title);
  });
});
