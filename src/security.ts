import { webcrypto } from "node:crypto";

const crypto =
	typeof globalThis.crypto !== "undefined"
		? globalThis.crypto
		: (webcrypto as unknown as Crypto);

/**
 * Checks if a password has been seen in a data breach using the HIBP k-Anonymity API.
 * @param password The password to check.
 * @returns The number of times the password was seen in breaches, or 0 if safe.
 */
export async function checkPwned(password: string): Promise<number> {
	try {
		const msgUint8 = new TextEncoder().encode(password);
		const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
			.toUpperCase();

		const prefix = hashHex.slice(0, 5);
		const suffix = hashHex.slice(5);

		// Use globalThis.fetch explicitly to support mocking
		const response = await globalThis.fetch(
			`https://api.pwnedpasswords.com/range/${prefix}`
		);
		if (!response.ok) return 0;

		const data = await response.text();
		const lines = data.split("\n");

		for (const line of lines) {
			const [hashSuffix, count] = line.split(":");
			if (hashSuffix.trim() === suffix) {
				return parseInt(count, 10);
			}
		}

		return 0;
	} catch {
		return 0;
	}
}
