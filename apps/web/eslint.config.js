import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";
import { baseConfig } from "@sync_board/eslint-config";

export default baseConfig({
    files: ["**/*.{ts,tsx}"],
    extends: [
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
        reactX.configs["recommended-typescript"],
        reactDom.configs.recommended,
    ],
    languageOptions: {
        globals: globals.browser,
        parserOptions: {
            project: ["./tsconfig.node.json", "./tsconfig.app.json"],
            tsconfigRootDir: import.meta.dirname,
        },
    },
    overrides: [
        {
            // Vite requires a default export from its config file.
            files: ["vite.config.ts"],
            rules: { "no-restricted-syntax": "off" },
        },
    ],
});
