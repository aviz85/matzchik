import { test, expect } from "@playwright/test";
test("Hebrew demo: filtering, searching, comments, bookmarking and profile navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "מאחורי הפאנץ׳." }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(3);
  await page.getByRole("button", { name: "רעיון", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "הכול", exact: true }).click();
  await page.getByRole("textbox", { name: "חיפוש בחומרים" }).fill("הפסיכולוג");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "1 תגובות" }).click();
  await expect(page.getByText("אולי: ״עכשיו")).toBeVisible();
  await page.getByRole("button", { name: "שמירה להמשך" }).click();
  await page.getByRole("textbox", { name: "חיפוש בחומרים" }).fill("");
  await page.getByRole("button", { name: "שמרתי להמשך", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "שמרתי להמשך", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "הקומיקאים", exact: true }).click();
  await expect(page.locator(".person")).toHaveCount(3);
  await page.locator(".person").first().click();
  await expect(page.locator("article")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("demo never pretends to register or publish; responsive layout fits mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("מצב הדגמה ·")).toBeVisible();
  await page.locator(".composer").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "מצטרפים לקהילה", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "סגירה", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "תפריט", exact: true }).click();
  await page.getByRole("button", { name: "שמרתי להמשך", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "שמרתי להמשך." }),
  ).toBeVisible();
});
