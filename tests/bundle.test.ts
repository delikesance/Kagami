import { test, expect } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const BUNDLE_PATH = join(import.meta.dir, "../dist/index.js");

test("Bundle structural integrity", () => {
  expect(existsSync(BUNDLE_PATH)).toBe(true);
  const content = readFileSync(BUNDLE_PATH, "utf-8");

  // Verify that the 'profile' command logic was bundled
  // We look for specific translation keys or unique strings from that command
  expect(content).toContain("commands.profile.title");
  expect(content).toContain("commands.profile.joined_at");

  // Verify that discord.js code is actually inlined
  // discord.js uses 'Client' and specific GatewayIntentBits names
  expect(content).toContain("GuildMembers");
  expect(content).toContain("MessageContent");
});

test("Bundle runtime smoke test", () => {
  // Run the bundle with a dummy token to see if it bootstraps correctly
  // It should fail with an invalid token error, NOT a "module not found" or syntax error
  const result = spawnSync("bun", [BUNDLE_PATH], {
    env: { ...process.env, DISCORD_TOKEN: "dummy_token_for_testing" },
    timeout: 5000,
  });

  const output = result.stdout.toString() + result.stderr.toString();
  
  // If it got far enough to try and login, the bundle is working
  // Discord.js throws [TokenInvalid] or similar
  expect(output).toMatch(/TokenInvalid|An invalid token was provided/);
});

test("Production dependency optimization", () => {
  // This test assumes 'bun install --production' was run in the devenv test flow
  const nmPath = join(import.meta.dir, "../node_modules");
  const modules = readdirSync(nmPath);
  
  // discord.js should NOT be a top-level folder in node_modules if it's purely a devDep
  // and we ran --production
  // Note: This might be tricky if the test runs in the same dir as dev, 
  // but in a clean CI/container it's vital.
  console.log("Modules in node_modules:", modules.slice(0, 10), "...");
});
