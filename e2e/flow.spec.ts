import { expect, test } from "@playwright/test";
import type { ChatResponse, Journey } from "../src/lib/types";

/** Same mock journey as app.spec.ts — a 2-node chain with a root task. */
const MOCK_JOURNEY: Journey = {
  id: "j-e2e-flow",
  lifeEvent: "JOB_CHANGE",
  title: "Job Change Journey",
  emoji: "💼",
  createdAt: new Date().toISOString(),
  entities: {},
  tasks: [
    { id: "e2e-verify", title: "Verify identity", description: "", service: "UIDAI", dependsOn: [], status: "locked" },
    { id: "e2e-kyc", title: "Complete UAN KYC", description: "", service: "EPFO", dependsOn: ["e2e-verify"], status: "locked" },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Detected a job change — building your journey.",
        detection: { lifeEvent: "JOB_CHANGE", entities: {}, journey: MOCK_JOURNEY },
      } satisfies ChatResponse),
    }),
  );
});

/** Creates the mock journey through the real UI flow and waits for the graph. */
async function createJourney(page: import("@playwright/test").Page) {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByPlaceholder("What happened in your life?").fill("I changed my job");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Verify identity").first()).toBeVisible({ timeout: 25_000 });
}

test("profile edits and document additions persist into the benefits page", async ({ page }) => {
  await createJourney(page);

  // open the profile editor from the header
  await page.getByTitle("Edit profile & DigiLocker documents").click();
  await expect(page.getByText("Citizen profile")).toBeVisible();

  // change the state
  await page.getByLabel("State").fill("Goa");

  // add an ADDRESS_PROOF document through the UI
  await page.getByLabel("Add document").selectOption({ label: "Address proof" });
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Address proof").first()).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();

  // give the debounced server save a beat, then check another page sees it
  await page.waitForTimeout(900);
  await page.goto("/benefits");
  await expect(page.getByText(/Goa resident/)).toBeVisible();
});

test("a journey can be deleted after confirmation", async ({ page }) => {
  await createJourney(page);

  page.once("dialog", (d) => d.accept());
  await page.getByTitle("Delete journey").first().click();

  // back to the empty state — the journey and its tasks are gone
  await expect(page.getByText("Tell me what happened in your life")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Verify identity")).toHaveCount(0);
});

test("health endpoint reports store connectivity", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { ok: boolean; store: string };
  expect(body.ok).toBe(true);
  expect(["sqlite", "postgres"]).toContain(body.store);
});