import { describe, it, expect } from "vitest";
import { PasswordGenerator, PRESETS } from "../src/pwd-gen.js";

describe("PasswordGenerator", () => {
	it("should generate a password with default length 12", () => {
		const password = PasswordGenerator.generate();
		expect(password).toHaveLength(12);
	});

	it("should throw error for invalid lengths", () => {
		expect(() => new PasswordGenerator({ length: 7 })).toThrow();
		expect(() => new PasswordGenerator({ length: 129 })).toThrow();
	});

	it("should respect minimum character requirements", () => {
		const result = PasswordGenerator.generateFull({
			length: 12,
			minDigit: 10,
			isSpecial: false
		});
		const digitCount = (result.password.match(/\d/g) || []).length;
		expect(digitCount).toBeGreaterThanOrEqual(10);
	});

	it("should enforce default composition when isSpecial is true", () => {
		const password = PasswordGenerator.generate({
			length: 12,
			isSpecial: true
		});
		expect(password).toMatch(/[a-z]/);
		expect(password).toMatch(/[A-Z]/);
		expect(password).toMatch(/\d/);
		expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/);
	});

	it("should generate a passphrase with correct number of words", () => {
		const result = PasswordGenerator.generateFull({
			mode: "passphrase",
			length: 4,
			separator: " "
		});
		const words = result.password.split(" ");
		expect(words).toHaveLength(4);
	});

	describe("Presets", () => {
		it("should apply wifi preset correctly", () => {
			const wifi = PasswordGenerator.generate({ preset: "wifi" });
			expect(wifi).toHaveLength(16);
			expect(wifi).toMatch(/^[a-zA-Z0-9]+$/);
		});

		it("should apply ultra preset correctly", () => {
			const ultra = PasswordGenerator.generateFull({ preset: "ultra" });
			expect(ultra.password).toHaveLength(64);
			expect(ultra.entropy).toBeGreaterThan(300);
		});
	});

	describe("Boundary values", () => {
		it("should accept minimum length of 8", () => {
			const password = PasswordGenerator.generate({ length: 8 });
			expect(password).toHaveLength(8);
		});

		it("should accept maximum length of 128", () => {
			const password = PasswordGenerator.generate({ length: 128 });
			expect(password).toHaveLength(128);
		});

		it("should accept passphrase minimum of 3 words", () => {
			const result = PasswordGenerator.generateFull({
				mode: "passphrase",
				length: 3
			});
			expect(result.password.split("-")).toHaveLength(3);
		});

		it("should accept passphrase maximum of 20 words", () => {
			const result = PasswordGenerator.generateFull({
				mode: "passphrase",
				length: 20
			});
			expect(result.password.split("-")).toHaveLength(20);
		});
	});

	describe("Error cases", () => {
		it("should throw for non-empty custom charset", () => {
			expect(
				() => new PasswordGenerator({ length: 10, customCharset: "ab" })
			).not.toThrow();
		});

		it("should throw when min requirements exceed length", () => {
			expect(() =>
				PasswordGenerator.generate({
					length: 8,
					minLower: 3,
					minUpper: 3,
					minDigit: 3,
					minSpecial: 3
				})
			).toThrow("Minimum requirements exceed");
		});

		it("should throw for invalid passphrase length", () => {
			expect(
				() => new PasswordGenerator({ mode: "passphrase", length: 2 })
			).toThrow("Passphrase length must be between 3 and 20 words.");
			expect(
				() => new PasswordGenerator({ mode: "passphrase", length: 21 })
			).toThrow("Passphrase length must be between 3 and 20 words.");
		});

		it("should throw for NaN length", () => {
			expect(() => PasswordGenerator.generate({ length: NaN })).toThrow(
				"Password length must be an integer"
			);
		});

		it("should throw for non-numeric length", () => {
			expect(
				() =>
					new PasswordGenerator({ length: "12" as unknown as number })
			).toThrow();
		});
	});

	describe("Custom options", () => {
		it("should accept custom separator for passphrase", () => {
			const result = PasswordGenerator.generateFull({
				mode: "passphrase",
				length: 3,
				separator: "_"
			});
			expect(result.password).toContain("_");
		});

		it("should use custom wordlist", () => {
			const customList = ["apple", "banana", "cherry"];
			const result = PasswordGenerator.generateFull({
				mode: "passphrase",
				length: 3,
				wordlist: customList
			});
			const words = result.password.split("-");
			words.forEach((word) => {
				expect(customList).toContain(word);
			});
		});

		it("should exclude similar characters", () => {
			const password = PasswordGenerator.generate({
				length: 100,
				excludeSimilar: true
			});
			expect(password).not.toMatch(/[il1Lo0O]/);
		});

		it("should use custom charset", () => {
			const password = PasswordGenerator.generate({
				length: 20,
				customCharset: "abc"
			});
			expect(password).toMatch(/^[abc]+$/);
		});
	});

	describe("Entropy calculations", () => {
		it("should calculate correct entropy for random mode", () => {
			const result = PasswordGenerator.generateFull({
				length: 12,
				isSpecial: false
			});
			const expectedEntropy = 12 * Math.log2(62);
			expect(result.entropy).toBeCloseTo(expectedEntropy, 0);
		});

		it("should calculate correct entropy for passphrase mode", () => {
			const result = PasswordGenerator.generateFull({
				mode: "passphrase",
				length: 5
			});
			const expectedEntropy = 5 * Math.log2(2052);
			expect(result.entropy).toBeCloseTo(expectedEntropy, 0);
		});

		it("should return correct strength levels", () => {
			const weakResult = {
				password: "abc",
				entropy: 30,
				strength: "Weak" as const
			};
			const mediumResult = {
				password: "abc",
				entropy: 50,
				strength: "Medium" as const
			};
			const strongResult = {
				password: "abc",
				entropy: 70,
				strength: "Strong" as const
			};
			const veryStrongResult = {
				password: "abc",
				entropy: 90,
				strength: "Very Strong" as const
			};

			expect(weakResult.strength).toBe("Weak");
			expect(mediumResult.strength).toBe("Medium");
			expect(strongResult.strength).toBe("Strong");
			expect(veryStrongResult.strength).toBe("Very Strong");
		});
	});

	describe("Numeric shorthand", () => {
		it("should accept number as shorthand for length", () => {
			const password = PasswordGenerator.generate(16);
			expect(password).toHaveLength(16);
		});

		it("should accept number for generateFull", () => {
			const result = PasswordGenerator.generateFull(20);
			expect(result.password).toHaveLength(20);
		});
	});

	describe("Instance methods", () => {
		it("should generate via instance generate()", () => {
			const gen = new PasswordGenerator({ length: 10 });
			const password = gen.generate();
			expect(password).toHaveLength(10);
		});

		it("should generate via instance generateFull()", () => {
			const gen = new PasswordGenerator({ length: 10 });
			const result = gen.generateFull();
			expect(result.password).toHaveLength(10);
			expect(result).toHaveProperty("entropy");
			expect(result).toHaveProperty("strength");
		});
	});

	describe("All presets", () => {
		it("should have all preset configurations", () => {
			expect(PRESETS.wifi).toBeDefined();
			expect(PRESETS.enterprise).toBeDefined();
			expect(PRESETS.legacy).toBeDefined();
			expect(PRESETS.ultra).toBeDefined();
		});

		it("should apply legacy preset", () => {
			const password = PasswordGenerator.generate({ preset: "legacy" });
			expect(password).toHaveLength(8);
			expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/);
		});

		it("should apply enterprise preset", () => {
			const result = PasswordGenerator.generateFull({
				preset: "enterprise"
			});
			expect(result.password).toHaveLength(20);
			expect(result.password).toMatch(/[A-Z]/);
			expect(result.password).toMatch(/[a-z]/);
			expect(result.password).toMatch(/\d/);
			expect(result.password).toMatch(
				/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/
			);
		});
	});

	describe("Randomness", () => {
		it("should generate unique passwords", () => {
			const passwords = new Set<string>();
			for (let i = 0; i < 100; i++) {
				passwords.add(PasswordGenerator.generate({ length: 12 }));
			}
			expect(passwords.size).toBe(100);
		});

		it("should generate unique passphrases", () => {
			const passphrases = new Set<string>();
			for (let i = 0; i < 100; i++) {
				passphrases.add(
					PasswordGenerator.generate({
						mode: "passphrase",
						length: 5
					})
				);
			}
			expect(passphrases.size).toBe(100);
		});
	});
});
