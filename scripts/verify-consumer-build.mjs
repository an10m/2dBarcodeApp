import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve("dist-consumer");
const requiredFiles = ["index.html", "manifest.webmanifest", "sw.js", "icon.svg"];
const missing = requiredFiles.filter((file) => !existsSync(resolve(outDir, file)));

if (missing.length) {
  console.error(`Consumer build is incomplete. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

if (existsSync(resolve(outDir, "index.consumer.html"))) {
  console.error("Consumer build still contains index.consumer.html; expected it to be renamed to index.html.");
  process.exit(1);
}

const serviceWorker = readFileSync(resolve(outDir, "sw.js"), "utf8");

if (serviceWorker.includes("index.consumer.html")) {
  console.error("Consumer service worker precaches index.consumer.html; expected index.html.");
  process.exit(1);
}

if (!serviceWorker.includes("index.html")) {
  console.error("Consumer service worker does not reference index.html.");
  process.exit(1);
}

const html = readFileSync(resolve(outDir, "index.html"), "utf8");

if (!html.includes('<div id="root"></div>')) {
  console.error("Consumer index.html does not contain the React root element.");
  process.exit(1);
}

console.log("Consumer build is ready: dist-consumer/index.html");
