// Uso: npm i simple-icons && node scripts/build-stack.js
// Gera um SVG por grupo no mesmo formato do skillicons.dev (tile 256, passo 300, altura 48).
const fs = require("fs");
const path = require("path");
const si = require("simple-icons");

const OUT = path.join(__dirname, "..", "assets", "stack");
const BG = "#242938";

const bySlug = {};
for (const k in si) if (si[k] && si[k].slug) bySlug[si[k].slug] = si[k];

const GROUPS = {
  languages: ["sk:ts", "sk:js", "sk:elixir", "sk:python"],
  frontend: ["sk:react", "sk:nextjs", "sk:astro", "sk:vite", "sk:tailwind", "sk:html", "sk:css"],
  "frontend-libs": ["si:shadcnui", "si:radixui", "si:reactquery", "si:reacthookform", "si:zod",
    "url:zustand", "si:framer", "si:greensock"],
  mobile: ["si:pwa", "si:bluetooth"],
  backend: ["sk:nodejs", "sk:prisma", "sk:postgres", "sk:redis", "si:neon", "si:upstash",
    "si:socketdotio", "si:pusher", "si:betterauth", "si:jsonwebtokens"],
  integrations: ["si:stripe", "si:mercadopago", "si:whatsapp", "si:resend", "si:puppeteer"],
  ai: ["si:claude", "si:anthropic", "url:openai"],
  testing: ["sk:jest", "sk:vitest", "url:playwright", "si:testinglibrary"],
  devops: ["sk:git", "sk:githubactions", "sk:docker", "sk:vercel", "sk:vscode"],
  learning: ["url:reactnative", "si:expo", "sk:aws"],
};

const URLS = {
  openai: { src: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/openai.svg", color: "#fff" },
  playwright: { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/playwright/playwright-original.svg" },
  zustand: { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/zustand/zustand-original.svg" },
  reactnative: { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/reactnative/reactnative-original.svg" },
};

function lum(hex) {
  const n = parseInt(hex, 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// logo em cor de marca sobre o fundo escuro; marca escura demais vira branco
function corLogo(hex) {
  return lum(hex) < 0.08 ? "#fff" : `#${hex}`;
}

function tile(inner, viewBox, { size = 150, color } = {}) {
  const o = (256 - size) / 2;
  const fill = color ? ` fill="${color}" color="${color}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="none" viewBox="0 0 256 256"><rect width="256" height="256" fill="${BG}" rx="60"/><svg x="${o}" y="${o}" width="${size}" height="${size}" viewBox="${viewBox}"${fill}>${inner}</svg></svg>`;
}

async function skillicon(id) {
  const txt = await (await fetch(`https://skillicons.dev/icons?i=${id}&theme=dark`)).text();
  const m = txt.match(/<g transform="translate\(0, 0\)">\s*([\s\S]*?)\s*<\/g>\s*<\/svg>\s*$/);
  if (!m) throw new Error(`skillicon ${id} sem conteúdo`);
  return m[1];
}

function simpleIcon(slug) {
  const ic = bySlug[slug];
  if (!ic) throw new Error(`simple-icons sem ${slug}`);
  return tile(`<path d="${ic.path}"/>`, "0 0 24 24", { color: corLogo(ic.hex) });
}

async function urlIcon(key) {
  const { src, color } = URLS[key];
  const txt = await (await fetch(src)).text();
  const vb = (txt.match(/viewBox="([^"]+)"/) || [])[1];
  let inner = txt.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  // ids de gradiente do devicon colidiriam com os de outro tile no mesmo arquivo
  inner = inner.replace(/id="([^"]+)"/g, `id="${key}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
    .replace(/xlink:href="#([^"]+)"/g, `xlink:href="#${key}-$1"`).replace(/href="#([^"]+)"/g, `href="#${key}-$1"`);
  return tile(inner, vb, { size: 160, color });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, items] of Object.entries(GROUPS)) {
    const tiles = [];
    for (const it of items) {
      const [kind, id] = it.split(":");
      tiles.push(kind === "sk" ? await skillicon(id) : kind === "si" ? simpleIcon(id) : await urlIcon(id));
    }
    const vw = tiles.length * 300 - 44;
    const w = +(vw * (48 / 256)).toFixed(2);
    const body = tiles.map((t, i) => `<g transform="translate(${i * 300}, 0)">${t}</g>`).join("\n");
    const svg = `<svg width="${w}" height="48" viewBox="0 0 ${vw} 256" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">\n${body}\n</svg>\n`;
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    console.log(name, tiles.length, "icons", (svg.length / 1024).toFixed(1) + "KB");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
