import { test, expect } from "@playwright/test";
import path from "path";

test("web demo generates a password", async ({ page }) => {
	const filePath = `file://${path.resolve("demo/index.html")}`;
	await page.goto(filePath);

	const generateBtn = page.locator("#generate");
	const resultDiv = page.locator("#result");
	const strengthDiv = page.locator("#strengthText");

	await generateBtn.click();

	const password = await resultDiv.textContent();
	expect(password).not.toBe("••••••••••••••••");
	expect(password?.length).toBeGreaterThanOrEqual(8);

	const strength = await strengthDiv.textContent();
	expect(strength).toMatch(/bits/);
});
