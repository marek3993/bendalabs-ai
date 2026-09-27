const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { platformArrow } = require("../src/components/bendalabs/platform-renderer.ts");
const cases = [
  [[0, 0, 0], [0, 0, -40]],
  [[2, -7, 5], [20, 4, 16]],
  [[-20, 5, 2], [-10, 5, 2]],
];

for (const [start, end] of cases) {
  const vertices = platformArrow(start, end);
  assert.ok(vertices.length > 0);
  assert.equal(vertices.length % 9, 0, "Arrow geometry must contain complete triangles");
  const delta = end.map((value, axis) => value - start[axis]);
  const length = Math.hypot(...delta);
  const direction = delta.map(value => value / length);
  let min = Infinity, max = -Infinity;

  for (let index = 0; index < vertices.length; index += 3) {
    const point = [vertices[index], vertices[index + 1], vertices[index + 2]];
    point.forEach(value => assert.ok(Number.isFinite(value)));
    const distance = point.reduce((sum, value, axis) => sum + (value - start[axis]) * direction[axis], 0);
    min = Math.min(min, distance);
    max = Math.max(max, distance);
  }
  assert.ok(Math.abs(min) < 1e-5, "Arrow starts at the specified world position");
  assert.ok(Math.abs(max - length) < 1e-5, "Arrow reaches the specified world endpoint");
}

assert.equal(platformArrow([0, 0, 0], [0, 0, 0]).length, 0);
const project = path.resolve(__dirname, "..");
const publicMesh = fs.readFileSync(path.join(project, "public/projects/platform-meshes.json"));
const meshHash = require("node:crypto").createHash("sha256").update(publicMesh).digest("hex");
assert.equal(meshHash, "04160c6f3d30e6c532b0201261d2e062bc9d7674575a58cd59687e168266fbc7", "Annotations must preserve the actual STL mesh payload");

console.log("PASS: world-space arrows are finite, directional and endpoint-correct; original mesh payload is unchanged.");
