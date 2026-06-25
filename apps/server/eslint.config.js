import globals from "globals";
import { baseConfig } from "@sync_board/eslint-config";

export default baseConfig({
    files: ["**/*.ts"],
    languageOptions: {
        globals: globals.node,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
    overrides: [
        {
            // drizzle-kit / vitest require a default export.
            files: ["drizzle.config.ts", "vitest.config.ts"],
            rules: {
                "no-restricted-syntax": "off",
            },
        },
    ],
});
