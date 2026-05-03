import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default {
  // Prettier runs from root on all staged TS/TSX files
  "**/*.{ts,tsx}": "prettier --write",

  // ESLint runs from each app's directory so its config + node_modules resolve correctly
  "apps/backend/**/*.ts": (files) => {
    const rel = files
      .map((f) => path.relative(path.join(root, "apps/backend"), f))
      .join(" ");
    return `bash -c 'cd apps/backend && pnpm exec eslint --fix ${rel}'`;
  },
  "apps/frontend/**/*.{ts,tsx}": (files) => {
    const rel = files
      .map((f) => path.relative(path.join(root, "apps/frontend"), f))
      .join(" ");
    return `bash -c 'cd apps/frontend && pnpm exec eslint --fix ${rel}'`;
  },
};
