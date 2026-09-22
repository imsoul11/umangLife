import { expect, test } from "@playwright/test";
import type { ChatResponse, Journey } from "../src/lib/types";

const MOCK_JOURNEY: Journey = {
  id: "j-e2e-1",
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

function chatReply(): ChatResponse {
  return {
    reply: "Detected a job change — building your journey.",
    detection: { lifeEvent: "JOB_CHANGE", entities: {}, journey: MOCK_JOURNEY },
  };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(chatReply()) }),
  );
});

test("shows the empty state on first load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Tell me what happened in your life")).toBeVisible();
  await expect(page.getByPlaceholder("What happened in your life?")).toBeVisible();
});

test("mocked life-event detection builds a journey graph and opens the wizard", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");

  await page.getByPlaceholder("What happened in your life?").fill("I changed my job");
  await page.getByRole("button", { name: "Send" }).click();

  // assistant reply lands immediately (mocked)
  await expect(page.getByText("Detected a job change — building your journey.")).toBeVisible();

  // journey-creation ceremony (~5 stages × 1.6s) then the graph reveals node by node
  await expect(page.getByText("Verify identity").first()).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText("Complete UAN KYC")).toBeVisible({ timeout: 15_000 });

  // click the unlocked root task → wizard modal opens
  await page.getByText("Verify identity").first().click();
  await expect(page.locator("div.fixed.inset-0").first()).toBeVisible();
});