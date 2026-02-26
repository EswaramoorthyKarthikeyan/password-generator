# 🔐 Password Generator (Enterprise Edition)

[![CI Status](https://github.com/eswarkarthik95/password-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/eswarkarthik95/password-generator/actions)
[![Security Audit](https://github.com/eswarkarthik95/password-generator/actions/workflows/ci.yml/badge.svg?branch=main&job=security)](https://github.com/eswarkarthik95/password-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/password-generator.svg)](https://www.npmjs.com/package/password-generator)
[![Coverage](https://img.shields.io/coveralls/github/eswarkarthik95/password-generator/main.svg)](https://coveralls.io/github/eswarkarthik95/password-generator)
[![Bundle Size](https://badges.speedgauge.com/v1/bundlephobia/password-generator)](https://bundlephobia.com/package/password-generator)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/eswarkarthik95/password-generator/badge)](https://scorecard.dev/viewer/?uri=github.com/eswarkarthik95/password-generator)

**The industry standard for cryptographically secure password and passphrase generation.**  
Built for high-reliability environments, security-conscious developers, and enterprise-grade applications.

---

## 💎 Key Features

- **🏆 Elite Security**: Uses CSPNRG entropy via `node:crypto`.
- **🛡️ Breach Protection**: Integrated **HIBP k-Anonymity API** for real-time leak checking.
- **📊 Metric Driven**: Real-time **Shannon Entropy** analysis and human-readable strength levels.
- **🏗️ Universal Architecture**: Multi-format bundles (**ESM, CJS, IIFE**) supporting Node, Browser, and Edge.
- **🛠️ Industrial Governance**: 100% TypeScript, strict linting, Vitest suite, and automated API documentation.
- **📚 Multiple Wordlists**: Built-in support for EFF wordlists (short, no-ambiguity).

---

## 📦 Installation

```bash
# Using npm
npm install password-generator

# Using pnpm (recommended)
pnpm add password-generator

# Using yarn
yarn add password-generator
```

---

## 🚀 Usage

### 💻 Command Line Interface (CLI)

The package includes a powerful interactive wizard and a flexible command-line tool.

```bash
# Interactive Wizard
pnpm cli --interactive

# Quick Generate (Length 24, Verbose, Check Leaks)
pnpm cli -l 24 -v --check

# Output as JSON
pnpm cli -l 16 --json
```

### 🛠 Library Integration (API)

```typescript
import { PasswordGenerator } from "password-generator";

// Simple generation
const pwd = PasswordGenerator.generate(16);

// Enterprise requirement: Min 2 special, 2 digits, 2 upper
const result = PasswordGenerator.generateFull({
	length: 20,
	minSpecial: 2,
	minDigit: 2,
	minUpper: 2
});

console.log(result.password); // "..."
console.log(result.entropy); // 124.5 bits
console.log(result.strength); // "Very Strong"
```

### 📜 Passphrase (Diceware) Mode

```typescript
const passphrase = PasswordGenerator.generate({
	mode: "passphrase",
	length: 6,
	separator: "-"
});
// Outputs: "correct-horse-battery-staple-..."
```

### 📚 Custom Wordlists

```typescript
import { PasswordGenerator, WORDLISTS } from "password-generator";

// Use EFF Short List 1 (1296 words)
const short = PasswordGenerator.generate({
	mode: "passphrase",
	length: 4,
	wordlist: WORDLISTS.short1
});

// Use No-Ambiguity wordlist (excludes similar-looking chars like l, 1, I, O, 0)
const unambiguous = PasswordGenerator.generate({
	mode: "passphrase",
	length: 5,
	wordlist: WORDLISTS.noAmbiguity
});

// Use your own custom wordlist
const custom = PasswordGenerator.generate({
	mode: "passphrase",
	length: 4,
	wordlist: ["apple", "banana", "cherry", "date", "elderberry"]
});
```

---

## 📑 API Reference

### Generation Options

| Option           | Type                   | Default     | Description                              |
| :--------------- | :--------------------- | :---------- | :--------------------------------------- |
| `mode`           | `random \| passphrase` | `random`    | Generation method.                       |
| `length`         | `number`               | `12`        | Chars for random, words for passphrase.  |
| `isSpecial`      | `boolean`              | `true`      | Include special characters.              |
| `customCharset`  | `string`               | `undefined` | Custom character set for random mode.    |
| `excludeSimilar` | `boolean`              | `false`     | Exclude ambiguous chars (l, 1, I, O, 0). |
| `minLower`       | `number`               | `0`         | Minimum lowercase characters.            |
| `minUpper`       | `number`               | `0`         | Minimum uppercase characters.            |
| `minDigit`       | `number`               | `0`         | Minimum numeric characters.              |
| `minSpecial`     | `number`               | `0`         | Minimum special characters.              |
| `separator`      | `string`               | `-`         | Separator for passphrase mode.           |
| `wordlist`       | `string[]`             | `default`   | Custom wordlist for passphrase mode.     |
| `preset`         | `string`               | `-`         | `wifi`, `enterprise`, `legacy`, `ultra`. |

### Available Wordlists

| Name          | Words | Description                        |
| :------------ | :---- | :--------------------------------- |
| `default`     | 2052  | Standard diceware wordlist.        |
| `short1`      | ~300  | EFF Short List 1 (memorable).      |
| `short2`      | ~300  | EFF Short List 2 (distinct).       |
| `noAmbiguity` | ~300  | No ambiguous characters (l, 1, I). |

### Security Functions

```typescript
import { checkPwned } from "password-generator";

const pwnedCount = await checkPwned("my-password");
if (pwnedCount > 0) {
	console.log(`⚠️ Found in ${pwnedCount} breaches!`);
}
```

### Presets

```typescript
import { PRESETS } from "password-generator";

// WiFi password (16 chars, no special, exclude similar)
const wifi = PasswordGenerator.generate({ preset: "wifi" });

// Enterprise (20 chars, 2+ special, 2+ digits, 2+ uppercase)
const enterprise = PasswordGenerator.generate({ preset: "enterprise" });

// Legacy (8 chars, with special)
const legacy = PasswordGenerator.generate({ preset: "legacy" });

// Ultra (64 chars, 10+ special, 10+ digits)
const ultra = PasswordGenerator.generate({ preset: "ultra" });
```

---

## �️ Security Principles

### **Entropy Source**

We use `crypto.getRandomValues()` (Browser) and `node:crypto` (Node.js) to ensure all randomness is derived from a **Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)**.

### **HIBP k-Anonymity**

When checking for leaked passwords, we use a **zero-trust model**. We SHA-1 hash the password, take only the first 5 characters, and send only that prefix to HIBP. Your full hash never leaves your machine.

---

## 🤝 Contributing

1. Clone the repo.
2. `pnpm install`.
3. `pnpm run precommit` to ensure builds, tests, and lints pass.
4. Follow **Conventional Commits** for all PRs.

---

## �📄 License

MIT © [Eswaramoorthy Karthikeyan](mailto:eswarkarthik95@gmail.com)
