import { build } from "bun";

const result = await build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "bun",
  minify: true,
  external: ["@napi-rs/canvas"],
});

if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log("Build successful!");
