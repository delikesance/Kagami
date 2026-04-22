import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

const rarities = ["common", "rare", "epic", "legendary"];
mkdirSync("assets/png", { recursive: true });

async function convert() {
  for (const r of rarities) {
    try {
      const svgPath = join("assets", "icons", `${r}.svg`);
      const svgData = readFileSync(svgPath, "utf-8");
      
      // We'll use a data URL to load the SVG into Canvas
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgData).toString("base64")}`;
      const image = await loadImage(dataUrl);
      
      const canvas = createCanvas(128, 128);
      const ctx = canvas.getContext("2d");
      
      // Draw the SVG image (assumed to be 100x100) centered in 128x128
      ctx.drawImage(image, 14, 14, 100, 100);
      
      const buffer = canvas.toBuffer("image/png");
      writeFileSync(join("assets", "png", `${r}.png`), buffer);
      console.log(`Successfully converted ${r}.svg to ${r}.png`);
    } catch (e) {
      console.error(`Failed to convert ${r}:`, e);
    }
  }
}

convert();
