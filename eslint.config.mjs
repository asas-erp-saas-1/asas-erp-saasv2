import js from "@eslint/js";
import eekPlugin from "./eek/eslint-plugin-eek.js";

export default [
  js.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "eek": eekPlugin
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "react/no-unescaped-entities": "off",
      "eek/no-raw-db-import": "error",
      "eek/no-unwrapped-server-actions": "error",
      "eek/enforce-withEEK": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/db",
              message: "RAW DB ACCESS FORBIDDEN: You must use `ctx.db` provided by the EEK wrapper (withEEK / withActionEEK). If you are inside /eek, disable this rule for the line.",
            }
          ]
        }
      ]
    },
  },
];