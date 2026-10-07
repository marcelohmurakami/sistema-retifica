import { expect, test } from "@playwright/test";
import { admin, getCatalog } from "./support";

test.describe("autenticação real do cliente", () => {
  let userId = "";
  let clientId = 0;
  let email = "";
  const password = "Codex-E2E-93!segura";

  test.beforeAll(async ({}, testInfo) => {
    const { site } = await getCatalog();
    email = `codex.e2e.${testInfo.project.name}.${Date.now()}@example.com`;
    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: "Cliente Homologação" },
    });
    if (userError || !created.user) throw userError ?? new Error("Usuário não criado.");
    userId = created.user.id;

    const { data: client, error: clientError } = await admin
      .from("clientes")
      .insert({
        id_empresa: site.empresa.id,
        nome: "Cliente Homologação",
        email,
        telefone_principal: "(11) 99999-0000",
        telefone_e164: "+5511999990000",
        auth_user_id: userId,
        ativo: true,
      })
      .select("id")
      .single();
    if (clientError || !client) throw clientError ?? new Error("Cliente não criado.");
    clientId = Number(client.id);
  });

  test.afterAll(async () => {
    if (clientId) await admin.from("clientes").delete().eq("id", clientId);
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  test("entra com e-mail e senha e mostra o nome da conta", async ({ page, isMobile }) => {
    await page.goto("/minha-conta");
    await page.getByLabel("E-mail do cadastro").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: /Entrar na minha conta/i }).click();

    await expect(page.getByRole("heading", { name: /Seu momento, organizado/i })).toBeVisible();
    await expect(page.getByText("Cliente Homologação", { exact: true }).first()).toBeVisible();
    if (isMobile) {
      await page.locator(".menu-button").click();
      await expect(page.locator(".mobile-account")).toContainText("Cliente");
    } else {
      await expect(page.getByRole("link", { name: /\u00c1rea de Cliente Homologação/i })).toBeVisible();
    }
  });
});
