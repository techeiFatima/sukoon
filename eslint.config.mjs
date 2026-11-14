import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**"] },
  {
    // These React Compiler advisories flag intentional patterns here
    // (syncing local form state from loaded rows; "latest value" refs).
    // Kept visible as warnings rather than errors.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
];
export default config;
