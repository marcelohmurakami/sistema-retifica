import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoSeriousAccessibilityViolations(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const violations = result.violations.filter((item) =>
    ["serious", "critical"].includes(item.impact ?? ""),
  );
  expect(
    violations.map((item) => ({ id: item.id, help: item.help, nodes: item.nodes.length })),
  ).toEqual([]);
}

test("página pública entrega SEO, dados estruturados e layout responsivo", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page).toHaveTitle(/Murakami Beauty/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /.+/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Murakami Beauty/i,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /.+/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /.+/,
  );

  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    schemas.map((value) => JSON.parse(value)).some((value) => value["@type"] === "BeautySalon"),
  ).toBeTruthy();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
  await expectNoSeriousAccessibilityViolations(page);
});

test("navega por teclado e expõe menu acessível", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#conteudo")).toBeFocused();

  if (isMobile) {
    const menu = page.locator(".menu-button");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toHaveAttribute("aria-label", "Fechar menu");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  }
});

test("área do cliente possui campos nomeados e valida entradas inválidas", async ({ page }) => {
  await page.goto("/minha-conta");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const email = page.getByLabel("E-mail do cadastro");
  const password = page.getByLabel("Senha", { exact: true });
  await email.fill("email-invalido");
  await password.fill("123");
  await page.getByRole("button", { name: /Entrar na minha conta/i }).click();
  expect(await email.evaluate((element: HTMLInputElement) => element.validity.valid)).toBeFalsy();
  expect(await password.evaluate((element: HTMLInputElement) => element.validity.valid)).toBeFalsy();
  await expectNoSeriousAccessibilityViolations(page);
});

test("rede lenta preserva estado de carregamento e conclui a agenda", async ({ page }) => {
  await page.route("**/api/site/availability?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    await route.continue();
  });
  await page.goto("/agendar");
  await page.getByRole("button", { name: /Continuar/i }).click();
  const slots = page.locator(".time-options");
  await expect(slots).toHaveAttribute("aria-busy", "true");
  await expect(slots).toHaveAttribute("aria-busy", "false", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Horários disponíveis" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
});

test("APIs rejeitam campos inválidos sem criar dados", async ({ request }) => {
  const availability = await request.get(
    "/api/site/availability?date=09-09-2026&serviceId=abc",
  );
  expect(availability.status()).toBe(400);

  const booking = await request.post("/api/site/bookings", {
    data: {
      serviceId: "x",
      professionalId: -1,
      start: "inválido",
      idempotencyKey: "inválido",
    },
  });
  expect(booking.status()).toBe(400);

  const registration = await request.post("/api/auth/password/register", {
    data: {
      email: "teste@example.com",
      password: "SenhaSegura123!",
      passwordConfirmation: "SenhaSegura123!",
    },
  });
  expect(registration.status()).toBe(403);
  expect((await registration.json()).code).toBe("BOOKING_REQUIRED");
});

test("URL inexistente devolve HTTP 404 e uma saída compreensível", async ({ page }) => {
  const response = await page.goto("/esta-rota-nao-existe-e2e");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /Empresa não encontrada/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tentar novamente/i })).toHaveAttribute("href", "/");
});
