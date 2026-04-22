import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "fs";
import { Rarity } from "../src/features/gacha/lib/gacha";

// Mocking the hex colors and drawing logic since we are outside the src context for a simple script
function getRarityColorHex(rarity: Rarity): string {
  switch (rarity) {
    case Rarity.COMMON: return "#ebdbb2";
    case Rarity.RARE: return "#83a598";
    case Rarity.EPIC: return "#d3869b";
    case Rarity.LEGENDARY: return "#fabd2f";
  }
}

function drawIcon(ctx: any, rarity: Rarity) {
  const rarityColor = getRarityColorHex(rarity);
  ctx.fillStyle = rarityColor;
  ctx.strokeStyle = "#3c3836";
  ctx.lineWidth = 4;

  if (rarity === Rarity.COMMON) {
    ctx.beginPath();
    ctx.moveTo(50, 10); ctx.lineTo(85, 30); ctx.lineTo(85, 70);
    ctx.lineTo(50, 90); ctx.lineTo(15, 70); ctx.lineTo(15, 30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (rarity === Rarity.RARE) {
    ctx.beginPath();
    ctx.moveTo(50, 10); ctx.lineTo(90, 50); ctx.lineTo(50, 90); ctx.lineTo(10, 50);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(50, 25); ctx.lineTo(75, 50); ctx.lineTo(50, 75); ctx.lineTo(25, 50);
    ctx.closePath();
    ctx.fill();
  } else if (rarity === Rarity.EPIC) {
    ctx.beginPath();
    ctx.moveTo(50, 5); ctx.lineTo(65, 35); ctx.lineTo(95, 50); ctx.lineTo(65, 65);
    ctx.lineTo(50, 95); ctx.lineTo(35, 65); ctx.lineTo(5, 50); ctx.lineTo(35, 35);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.arc(50, 50, 10, 0, Math.PI * 2); ctx.fill();
  } else if (rarity === Rarity.LEGENDARY) {
    ctx.beginPath(); ctx.arc(50, 50, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ebdbb2";
    ctx.beginPath();
    ctx.moveTo(50, 15); ctx.lineTo(55, 45); ctx.lineTo(85, 50); ctx.lineTo(55, 55);
    ctx.lineTo(50, 85); ctx.lineTo(45, 55); ctx.lineTo(15, 50); ctx.lineTo(45, 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#282828";
    ctx.beginPath(); ctx.arc(50, 50, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

mkdirSync("assets/png", { recursive: true });

for (const rarity of Object.values(Rarity)) {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.translate(14, 14); // Center the 100x100 icon in 128x128
  drawIcon(ctx, rarity as Rarity);
  writeFileSync(`assets/png/${rarity.toLowerCase()}.png`, canvas.toBuffer("image/png"));
  console.log(`Generated assets/png/${rarity.toLowerCase()}.png`);
}
