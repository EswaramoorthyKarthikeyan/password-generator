#!/usr/bin/env node
import { Command } from "commander";
import { PasswordGenerator, PasswordOptions } from "./pwd-gen.js";
import { checkPwned } from "./security.js";
import clipboardy from "clipboardy";
import * as p from "@clack/prompts";
import { readFileSync } from "fs";

const program = new Command();

program
	.name("pwd-gen")
	.description("Generate cryptographically secure passwords")
	.version("0.1.0");

program
	.option("-l, --length <number>", "length of the password", "12")
	.option(
		"-m, --mode <string>",
		"generation mode (random, passphrase)",
		"random"
	)
	.option("-s, --no-special", "exclude special characters")
	.option("-c, --charset <string>", "use a custom character set")
	.option("-n, --count <number>", "number of passwords to generate", "1")
	.option("-e, --exclude-similar", "exclude similar-looking characters")
	.option("-v, --verbose", "show security metrics (entropy and strength)")
	.option("-j, --json", "output in JSON format")
	.option("-y, --copy", "copy the (first) generated password to clipboard")
	.option("-i, --interactive", "run in interactive mode")
	.option("--check", "check if the generated password has been pwned (HIBP)")
	.option("--min-lower <number>", "minimum lowercase characters", "0")
	.option("--min-upper <number>", "minimum uppercase characters", "0")
	.option("--min-digit <number>", "minimum digit characters", "0")
	.option("--min-special <number>", "minimum special characters", "0")
	.option("--separator <string>", "passphrase separator", "-")
	.option("--wordlist <path>", "path to a custom wordlist file")
	.option(
		"-p, --preset <name>",
		"use a security preset (wifi, enterprise, legacy, ultra)"
	)
	.action(async (options) => {
		if (options.interactive) {
			await runInteractive();
			return;
		}

		try {
			const count = parseInt(options.count, 10);
			if (isNaN(count) || count < 1 || count > 100) {
				throw new Error("Count must be a number between 1 and 100.");
			}

			let customWordlist: string[] | undefined;
			if (options.wordlist) {
				customWordlist = readFileSync(options.wordlist, "utf-8")
					.split("\n")
					.map((w) => w.trim())
					.filter((w) => w.length > 0);
			}

			const presetName =
				options.preset as keyof typeof PasswordGenerator.PRESETS;
			const presetOptions = options.preset
				? PasswordGenerator.PRESETS[presetName]
				: {};
			if (options.preset && !presetOptions) {
				throw new Error(
					`Unknown preset: ${options.preset}. Available: ${Object.keys(PasswordGenerator.PRESETS).join(", ")}`
				);
			}

			const genOptions: PasswordOptions = {
				mode: options.mode,
				length: parseInt(options.length, 10),
				isSpecial: options.special,
				customCharset: options.charset,
				excludeSimilar: options.excludeSimilar,
				minLower: parseInt(options.minLower, 10),
				minUpper: parseInt(options.minUpper, 10),
				minDigit: parseInt(options.minDigit, 10),
				minSpecial: parseInt(options.minSpecial, 10),
				separator: options.separator,
				wordlist: customWordlist,
				...presetOptions
			};

			const generator = new PasswordGenerator(genOptions);
			const results = [];

			for (let i = 0; i < count; i++) {
				const fullResult = generator.generateFull();
				const result = {
					...fullResult,
					pwnedCount: 0
				};
				if (options.check) {
					result.pwnedCount = await checkPwned(result.password);
				}
				results.push(result);
			}

			if (options.copy && results.length > 0) {
				await clipboardy.write(results[0].password);
			}

			if (options.json) {
				console.log(
					JSON.stringify(count === 1 ? results[0] : results, null, 2)
				);
			} else {
				for (const result of results) {
					const pwnedInfo =
						options.check && result.pwnedCount > 0
							? ` [\x1b[31mPWNED: ${result.pwnedCount} times\x1b[0m]`
							: options.check
								? ` [\x1b[32mSAFE\x1b[0m]`
								: "";

					if (options.verbose) {
						const strengthColor = getStrengthColor(result.strength);
						console.log(
							`${result.password}${pwnedInfo} [${result.entropy} bits, ${strengthColor}${result.strength}\x1b[0m]`
						);
					} else {
						console.log(`${result.password}${pwnedInfo}`);
					}
				}
				if (options.copy) {
					console.log(
						"\x1b[32m(First password copied to clipboard!)\x1b[0m"
					);
				}
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			console.error(`Error: ${message}`);
			process.exit(1);
		}
	});

async function runInteractive() {
	p.intro("\x1b[36mPassword Generator - Interactive Mode\x1b[0m");

	const mode = await p.select({
		message: "Select generation mode:",
		options: [
			{ value: "random", label: "Random Characters" },
			{ value: "passphrase", label: "Passphrase (Diceware)" }
		]
	});

	if (p.isCancel(mode)) return;

	let options: PasswordOptions = { mode: mode as "random" | "passphrase" };

	if (mode === "random") {
		const length = await p.text({
			message: "Password length:",
			initialValue: "16",
			validate: (val) => {
				const n = parseInt(val, 10);
				if (isNaN(n) || n < 8 || n > 128)
					return "Must be between 8 and 128";
			}
		});
		if (p.isCancel(length)) return;

		const isSpecial = await p.confirm({
			message: "Include special characters?",
			initialValue: true
		});
		if (p.isCancel(isSpecial)) return;

		options = { ...options, length: parseInt(length, 10), isSpecial };
	} else {
		const words = await p.text({
			message: "Number of words:",
			initialValue: "5",
			validate: (val) => {
				const n = parseInt(val, 10);
				if (isNaN(n) || n < 3 || n > 20)
					return "Must be between 3 and 20";
			}
		});
		if (p.isCancel(words)) return;

		options = { ...options, length: parseInt(words, 10) };
	}

	const result = PasswordGenerator.generateFull(options);
	const pwnedCount = await checkPwned(result.password);
	const pwnedStatus =
		pwnedCount > 0
			? `\x1b[31mPWNED ${pwnedCount} times!\x1b[0m`
			: `\x1b[32mSafe (not in leaks)\x1b[0m`;

	p.note(
		`${result.password}\n\nStrength: ${result.strength}\nStatus: ${pwnedStatus}`,
		`Generated Password`
	);

	const copy = await p.confirm({
		message: "Copy to clipboard?",
		initialValue: true
	});

	if (copy && !p.isCancel(copy)) {
		await clipboardy.write(result.password);
		p.outro("\x1b[32mCopied and finished!\x1b[0m");
	} else {
		p.outro("Finished!");
	}
}

function getStrengthColor(strength: string): string {
	switch (strength) {
		case "Very Strong":
			return "\x1b[32m"; // Green
		case "Strong":
			return "\x1b[36m"; // Cyan
		case "Medium":
			return "\x1b[33m"; // Yellow
		default:
			return "\x1b[31m"; // Red
	}
}

program.parse();
