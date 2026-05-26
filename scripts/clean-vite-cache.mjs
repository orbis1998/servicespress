import { rmSync } from "node:fs";

for (const dir of ["node_modules/.vite", "dist", ".wrangler"]) {
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log("Supprimé:", dir);
  } catch {
    /* ignore */
  }
}
console.log("Cache nettoyé. Relancez npm run dev.");
