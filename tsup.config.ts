import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	format: ["cjs", "esm", "iife"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: true,
	globalName: "PasswordGen",
	outDir: "dist",
	shims: true
});
