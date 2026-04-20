import { createCanvas } from "@napi-rs/canvas";

/**
 * Generates a random CAPTCHA string
 */
export function generateCaptchaText(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars like 1, I, O, 0
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

/**
 * Generates a CAPTCHA image buffer
 */
export async function generateCaptchaImage(text: string): Promise<Buffer> {
  const width = 300;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Background
  ctx.fillStyle = "#2c2f33"; // Discord-ish dark grey
  ctx.fillRect(0, 0, width, height);

  // 2. Add some random noise lines
  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // 3. Draw text with random rotation and positioning
  ctx.font = "bold 48px sans-serif";
  ctx.textBaseline = "middle";
  
  const totalWidth = ctx.measureText(text).width;
  let startX = (width - totalWidth) / 2;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.fillStyle = `rgb(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${100 + Math.random() * 155})`;
    
    ctx.save();
    ctx.translate(startX + 20, height / 2);
    ctx.rotate((Math.random() - 0.5) * 0.4); // Random rotation
    ctx.fillText(char, 0, 0);
    ctx.restore();
    
    startX += ctx.measureText(char).width + 5;
  }

  // 4. Add more noise (dots)
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}
