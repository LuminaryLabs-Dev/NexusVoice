import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "out");
const required = ["index.html", ".nojekyll"];

for (const relative of required) {
  if (!fs.existsSync(path.join(output, relative))) {
    throw new Error(`Static export is missing ${relative}`);
  }
}

const index = fs.readFileSync(path.join(output, "index.html"), "utf8");
for (const expected of ["NexusVoice", "Give the line", "Generate voice", "Voice takes"]) {
  if (!index.includes(expected)) throw new Error(`Static export is missing visible content: ${expected}`);
}
if (!fs.existsSync(path.join(output, "_next"))) {
  throw new Error("Static export is missing its Next.js assets.");
}

console.log("NexusVoice Studio static export validation passed.");
