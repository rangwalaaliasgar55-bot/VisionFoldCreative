#!/usr/bin/env node
/**
 * Shader syntax gate.
 *
 * A typo inside a template-literal shader is invisible to TypeScript and to
 * `next build` — it only shows up as a blank backdrop and a console error in
 * the browser. This parses every GLSL block in the WebGL components so a broken
 * shader fails in CI instead of on a client's laptop.
 *
 * Usage: node scripts/check-shaders.mjs
 */
import { readFileSync } from "node:fs";
import { parser } from "@shaderfrog/glsl-parser";

const FILES = [
  "src/components/ThreeBackground.tsx",
  "src/components/ClientsGlobeSection.tsx",
];

// three.js injects these for every (non-raw) ShaderMaterial.
const THREE_PRELUDE = `
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
`;

const FRAG_PRELUDE = `
precision highp float;
precision highp int;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
`;

/** Pull `name = \`...\`` template constants so ${NOISE_GLSL} can be resolved. */
function collectConstants(src) {
  const out = {};
  const re = /const\s+([A-Z0-9_]+)\s*=\s*`([\s\S]*?)`;/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = m[2];
  return out;
}

/** Pull every `vertexShader: \`...\`` / `fragmentShader: \`...\`` block. */
function collectShaders(src) {
  const out = [];
  const re = /(vertexShader|fragmentShader)\s*:\s*`([\s\S]*?)`\s*,/g;
  let m;
  while ((m = re.exec(src))) {
    const line = src.slice(0, m.index).split("\n").length;
    out.push({ kind: m[1], body: m[2], line });
  }
  return out;
}

let checked = 0;
let failed = 0;

for (const file of FILES) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const constants = collectConstants(src);

  for (const shader of collectShaders(src)) {
    let body = shader.body;
    for (const [name, value] of Object.entries(constants)) {
      body = body.split("${" + name + "}").join(value);
    }
    if (body.includes("${")) {
      console.error(`✗ ${file}:${shader.line} ${shader.kind}: unresolved interpolation`);
      failed++;
      continue;
    }

    const prelude = shader.kind === "vertexShader" ? THREE_PRELUDE : FRAG_PRELUDE;
    try {
      parser.parse(prelude + body, { quiet: true });
      checked++;
    } catch (err) {
      failed++;
      console.error(`✗ ${file}:${shader.line} ${shader.kind}\n  ${err.message}`);
    }
  }
}

if (failed) {
  console.error(`\n${failed} shader(s) failed to parse.`);
  process.exit(1);
}
console.log(`✓ ${checked} shaders parsed cleanly`);
