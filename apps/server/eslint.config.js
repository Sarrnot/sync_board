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
});
