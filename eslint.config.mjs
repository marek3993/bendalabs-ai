import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-old/**",
      ".sandbox-run-*/**",
      ".tmp-*/**",
      "node_modules/**",
    ],
  },
  ...nextVitals,
];

export default config;
