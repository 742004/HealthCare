import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                process: "readonly",
                console: "readonly",
                __dirname: "readonly",
                Buffer: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                beforeEach: "readonly",
                afterAll: "readonly",
                afterEach: "readonly",
                jest: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^(req|res|next|err|_)$" }],
            "no-empty": ["warn", { "allowEmptyCatch": true }],
            "no-undef": "warn",
            "no-useless-escape": "warn"
        }
    }
];
