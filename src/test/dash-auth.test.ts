import { describe, expect, it } from "vitest";
import { onRequestPost } from "../../functions/api/auth/verify.js";

describe("acesso ao dash", () => {
  const request = (key: string) => new Request("https://matrix-estrutura-reservas.pages.dev/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  it("aceita a mesma DASH_KEY usada pelo CRM sem consultar o banco", async () => {
    const response = await onRequestPost({ request: request("senha-correta"), env: { DASH_KEY: "senha-correta" } });
    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("recusa uma chave diferente", async () => {
    const response = await onRequestPost({ request: request("outra-senha"), env: { DASH_KEY: "senha-correta" } });
    expect(response.status).toBe(401);
  });
});
