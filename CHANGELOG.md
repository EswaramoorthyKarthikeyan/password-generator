# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-25

### Added

- **Enterprise Core**: Upgraded generation to a high-performance "guarantee-and-shuffle" algorithm.
- **Diceware Mode**: Support for multi-word passphrases using the EFF Large wordlist.
- **Security Logic**: Built-in integration with the "Have I Been Pwned" (HIBP) k-Anonymity API.
- **Presets**: Industry-standard configuration presets (`wifi`, `enterprise`, `legacy`, `ultra`).
- **Interactive CLI**: Guided wizard for step-by-step password generation.
- **Web Demo**: Fully redesigned, professional browser interface with real-time breach checking.
- **Multi-Format Distribution**: Support for ESM, CommonJS, and IIFE bundles.
- **Quality Gates**: Multi-platform CI (Linux, Windows, macOS), Playwright E2E tests, and TypeDoc documentation.

### Changed

- Refactored core to use **Web Crypto API** (`crypto.getRandomValues`) for universal compatibility.
- Updated documentation to reflect "Enterprise Edition" features.

### Fixed

- Resolved `NaN` length infinite loop bug.
- Improved entropy calculation accuracy for various character sets.
- Fixed ESM import/export compatibility issues for NodeNext.

## [0.2.0] - 2026-01-25

### Added

- Support for `excludeSimilar` characters.
- JSON output support in CLI.
- Clipboard integration for easy copying.

## [0.1.0] - 2026-01-25

### Added

- Initial implementation of `PasswordGenerator`.
- Basic CLI interface with `commander`.
- Unit test suite with Vitest.
