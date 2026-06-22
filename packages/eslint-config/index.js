import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Shared ESLint base for every app in the monorepo.
 * Contains the common parts:
 * - base JS/TS rules
 * - Prettier rules
 * - no-default-export rule
 *
 * @param options
 * @param options.files - Glob(s) the config applies to.
 * @param options.languageOptions - App language options (globals, parser).
 * @param options.extends - Extra configs (e.g. React plugins).
 * @param options.overrides - Extra config blocks appended after the base
 *   (e.g. per-file rule exemptions).
 */
export const baseConfig = ({
    files,
    languageOptions,
    extends: extra = [],
    overrides = [],
}) =>
    defineConfig([
        globalIgnores(["dist"]),
        {
            files,
            extends: [
                js.configs.recommended,
                tseslint.configs.strictTypeChecked,
                tseslint.configs.stylisticTypeChecked,
                ...extra,
                prettier,
            ],
            languageOptions,
            rules: {
                "no-restricted-syntax": [
                    "error",
                    {
                        selector:
                            'ExportDefaultDeclaration, ExportSpecifier[exported.name="default"]',
                        message: "No default exports, named exports only.",
                    },
                ],
                // Prefer `type` aliases instead of `interface`.
                "@typescript-eslint/consistent-type-definitions": [
                    "error",
                    "type",
                ],
            },
        },
        ...overrides,
    ]);
