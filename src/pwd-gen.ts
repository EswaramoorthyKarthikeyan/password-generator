import { getRandomValues } from "node:crypto";
import { DEFAULT_WORDLIST } from "./wordlist.js";

/**
 * Industry-standard security presets.
 */
export const PRESETS = {
	wifi: { length: 16, isSpecial: false, excludeSimilar: true },
	enterprise: { length: 20, minSpecial: 2, minDigit: 2, minUpper: 2 },
	legacy: { length: 8, isSpecial: true },
	ultra: { length: 64, minSpecial: 10, minDigit: 10 }
} as const;

/**
 * Options for password generation.
 */
export interface PasswordOptions {
	/** Mode of generation: 'random' (default) or 'passphrase'. */
	mode?: "random" | "passphrase";
	/** Length (chars for random, words for passphrase). Default: 12 (random) / 5 (passphrase). */
	length?: number;
	/** Whether to include special characters in random mode. Default: true. */
	isSpecial?: boolean;
	/** A custom character set for random mode. */
	customCharset?: string;
	/** Whether to exclude similar-looking characters. Default: false. */
	excludeSimilar?: boolean;
	/** Minimum number of lowercase characters. */
	minLower?: number;
	/** Minimum number of uppercase characters. */
	minUpper?: number;
	/** Minimum number of digit characters. */
	minDigit?: number;
	/** Minimum number of special characters. */
	minSpecial?: number;
	/** Separator for passphrase mode. Default: '-'. */
	separator?: string;
	/** Custom wordlist for passphrase mode. */
	wordlist?: string[];
	/** Built-in security preset. */
	preset?: keyof typeof PRESETS;
}

/**
 * Result of password generation including security metrics.
 */
export interface PasswordResult {
	/** The generated password string. */
	password: string;
	/** Estimated bits of entropy. */
	entropy: number;
	/** Human-readable strength level. */
	strength: "Weak" | "Medium" | "Strong" | "Very Strong";
}

/**
 * A cryptographically secure password generator.
 */
class PasswordGenerator {
	private readonly mode: "random" | "passphrase";
	private readonly length: number;
	private readonly charset: string;
	private readonly isSpecial: boolean;
	private readonly options: PasswordOptions;

	private static readonly LOWER = "abcdefghijklmnopqrstuvwxyz";
	private static readonly UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	private static readonly DIGITS = "0123456789";
	private static readonly SPECIAL = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
	private static readonly SIMILAR_CHARS = /[il1Lo0O]/g;

	/**
	 * Re-export presets for convenience.
	 */
	public static readonly PRESETS = PRESETS;

	/**
	 * Creates a new PasswordGenerator instance.
	 */
	constructor(options: PasswordOptions = {}) {
		// Merge preset if provided
		const preset = options.preset ? PRESETS[options.preset] : {};
		this.options = { ...options, ...preset };
		this.mode = this.options.mode || "random";

		if (this.mode === "random") {
			const {
				length = 12,
				isSpecial = true,
				customCharset,
				excludeSimilar = false
			} = this.options;

			if (
				typeof length !== "number" ||
				isNaN(length) ||
				length < 8 ||
				length > 128
			) {
				throw new Error(
					"Password length must be an integer between 8 and 128 characters."
				);
			}

			this.length = Math.floor(length);
			this.isSpecial = isSpecial;

			let baseCharset: string;
			if (customCharset) {
				if (customCharset.length === 0) {
					throw new Error("Custom charset cannot be empty.");
				}
				baseCharset = customCharset;
			} else {
				baseCharset = isSpecial
					? PasswordGenerator.LOWER +
						PasswordGenerator.UPPER +
						PasswordGenerator.DIGITS +
						PasswordGenerator.SPECIAL
					: PasswordGenerator.LOWER +
						PasswordGenerator.UPPER +
						PasswordGenerator.DIGITS;
			}

			if (excludeSimilar) {
				this.charset = baseCharset.replace(
					PasswordGenerator.SIMILAR_CHARS,
					""
				);
				if (this.charset.length === 0) {
					throw new Error(
						"Charset is empty after excluding similar characters."
					);
				}
			} else {
				this.charset = baseCharset;
			}
		} else {
			const { length = 5 } = this.options;
			if (length < 3 || length > 20) {
				throw new Error(
					"Passphrase length must be between 3 and 20 words."
				);
			}
			this.length = length;
			this.isSpecial = false;
			this.charset = "";
		}
	}

	private getWordlist(): string[] {
		return this.options.wordlist || DEFAULT_WORDLIST;
	}

	/**
	 * Generates a password result including security metrics.
	 */
	public generateFull(): PasswordResult {
		if (this.mode === "passphrase") {
			return this.generatePassphrase();
		}
		return this.generateRandom();
	}

	private generateRandom(): PasswordResult {
		const {
			minLower = 0,
			minUpper = 0,
			minDigit = 0,
			minSpecial = 0,
			isSpecial = true,
			customCharset
		} = this.options;

		// Default minimums when isSpecial is true and no custom charset is used
		const actualMinLower =
			!customCharset && isSpecial ? Math.max(minLower, 1) : minLower;
		const actualMinUpper =
			!customCharset && isSpecial ? Math.max(minUpper, 1) : minUpper;
		const actualMinDigit =
			!customCharset && isSpecial ? Math.max(minDigit, 1) : minDigit;
		const actualMinSpecial =
			!customCharset && isSpecial ? Math.max(minSpecial, 1) : minSpecial;

		const requiredChars: string[] = [];

		// Guarantee characters
		for (let i = 0; i < actualMinLower; i++)
			requiredChars.push(this.pick(PasswordGenerator.LOWER));
		for (let i = 0; i < actualMinUpper; i++)
			requiredChars.push(this.pick(PasswordGenerator.UPPER));
		for (let i = 0; i < actualMinDigit; i++)
			requiredChars.push(this.pick(PasswordGenerator.DIGITS));
		for (let i = 0; i < actualMinSpecial; i++)
			requiredChars.push(this.pick(PasswordGenerator.SPECIAL));

		if (requiredChars.length > this.length) {
			throw new Error(
				"Minimum requirements exceed the requested password length."
			);
		}

		// Fill the rest
		for (let i = requiredChars.length; i < this.length; i++) {
			requiredChars.push(this.pick(this.charset));
		}

		// Shuffle
		const password = this.shuffle(requiredChars).join("");
		const entropy = this.calculateEntropy();

		return {
			password,
			entropy,
			strength: this.getStrengthLevel(entropy)
		};
	}

	private pick(source: string): string {
		const filtered = this.options.excludeSimilar
			? source.replace(PasswordGenerator.SIMILAR_CHARS, "")
			: source;
		if (filtered.length === 0)
			return source[this.getRandomInt(0, source.length)];
		return filtered[this.getRandomInt(0, filtered.length)];
	}

	private shuffle<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.getRandomInt(0, i + 1);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	private generatePassphrase(): PasswordResult {
		const words: string[] = [];
		const separator = this.options.separator || "-";
		const wordlist = this.getWordlist();

		for (let i = 0; i < this.length; i++) {
			const index = this.getRandomInt(0, wordlist.length);
			words.push(wordlist[index]);
		}

		const password = words.join(separator);
		const entropy = this.calculatePassphraseEntropy();

		return {
			password,
			entropy,
			strength: this.getStrengthLevel(entropy)
		};
	}

	private getRandomInt(min: number, max: number): number {
		const range = max - min;
		const bitsNeeded = Math.ceil(Math.log2(range));
		const bytesNeeded = Math.ceil(bitsNeeded / 8);
		const maxValue = Math.pow(256, bytesNeeded);

		const byteArray = new Uint8Array(bytesNeeded);
		while (true) {
			getRandomValues(byteArray);
			let val = 0;
			for (let i = 0; i < bytesNeeded; i++) {
				val = (val << 8) + byteArray[i];
			}
			if (val < maxValue - (maxValue % range)) {
				return min + (val % range);
			}
		}
	}

	public generate(): string {
		return this.generateFull().password;
	}

	private calculateEntropy(): number {
		const entropy = this.length * Math.log2(this.charset.length);
		return Math.round(entropy * 100) / 100;
	}

	private calculatePassphraseEntropy(): number {
		const entropy = this.length * Math.log2(this.getWordlist().length);
		return Math.round(entropy * 100) / 100;
	}

	private getStrengthLevel(
		entropy: number
	): "Weak" | "Medium" | "Strong" | "Very Strong" {
		if (entropy < 40) return "Weak";
		if (entropy < 60) return "Medium";
		if (entropy < 80) return "Strong";
		return "Very Strong";
	}

	public static generate(options: PasswordOptions | number = 12): string {
		const finalOptions =
			typeof options === "number" ? { length: options } : options || {};
		const gen = new PasswordGenerator(finalOptions);
		return gen.generate();
	}

	public static generateFull(
		options: PasswordOptions | number = 12
	): PasswordResult {
		const finalOptions =
			typeof options === "number" ? { length: options } : options || {};
		const gen = new PasswordGenerator(finalOptions);
		return gen.generateFull();
	}
}

export { PasswordGenerator };
