#!/usr/bin/env node
/**
 * Converts hero1 PNG frames to WebP for production deployment.
 * Input:  public/hero1/frame_001.png … frame_197.png (195 valid frames)
 * Output: public/hero1-webp/frame_001.webp … frame_197.webp
 * Quality: 85 (visually lossless at 1280×720, ~50 KB/frame vs ~1.3 MB PNG)
 */

const fs = require("fs");
const path = require("path");
const sharp = require("../node_modules/sharp");

const SRC_DIR = path.join(__dirname, "../public/hero1");
const OUT_DIR = path.join(__dirname, "../public/hero1-webp");
const QUALITY = 85;
const CONCURRENCY = 8;

const MISSING = new Set([106, 109]);

const frames = Array.from({ length: 197 }, (_, i) => i + 1).filter(
  (n) => !MISSING.has(n)
);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let converted = 0;
let skipped = 0;
let errors = 0;
const startTime = Date.now();

async function convertFrame(frameNum) {
  const paddedNum = String(frameNum).padStart(3, "0");
  const src = path.join(SRC_DIR, `frame_${paddedNum}.png`);
  const dst = path.join(OUT_DIR, `frame_${paddedNum}.webp`);

  if (!fs.existsSync(src)) {
    console.error(`  MISSING: frame_${paddedNum}.png`);
    errors++;
    return;
  }

  if (fs.existsSync(dst)) {
    skipped++;
    return;
  }

  try {
    await sharp(src)
      .webp({ quality: QUALITY, effort: 4, smartSubsample: true })
      .toFile(dst);
    converted++;
    if (converted % 20 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = ((converted + skipped) / frames.length * 100).toFixed(0);
      console.log(`  [${progress}%] ${converted} converted, ${skipped} skipped (${elapsed}s)`);
    }
  } catch (err) {
    console.error(`  ERROR frame_${paddedNum}: ${err.message}`);
    errors++;
  }
}

async function run() {
  console.log(`Converting ${frames.length} hero1 PNG frames to WebP (q${QUALITY})...`);
  console.log(`  Source: ${SRC_DIR}`);
  console.log(`  Output: ${OUT_DIR}`);

  const queue = [...frames];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const n = queue.shift();
      await convertFrame(n);
    }
  });

  await Promise.all(workers);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s:`);
  console.log(`  Converted: ${converted}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  if (converted + skipped > 0) {
    const webpFiles = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webp"));
    let totalBytes = 0;
    webpFiles.forEach((f) => {
      totalBytes += fs.statSync(path.join(OUT_DIR, f)).size;
    });
    console.log(`  Total WebP size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  Average per frame: ${(totalBytes / webpFiles.length / 1024).toFixed(1)} KB`);
  }
}

run().catch(console.error);
