const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const crypto = require("node:crypto");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, ...rest);
};
require.extensions[".css"] = () => {};
for (const extension of [".ts", ".tsx"]) require.extensions[extension] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

// Read the real source exports in memory, without altering production modules.
function inspectModule(file, names) {
  const filename = path.join(root, file);
  const source = fs.readFileSync(filename, "utf8") + `\nexport { ${names.join(", ")} };`;
  const output = ts.transpileModule(source, { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(output.outputText, filename);
  return instance.exports;
}

const components = "src/components/bendalabs/";
const mecanum = require(path.join(root, components, "mecanum-drive.tsx")).default;
const ticker = require(path.join(root, components, "ticker-device.tsx")).default;
const platform = require(path.join(root, components, "platform-explainer.tsx")).default;
const wrapper = require(path.join(root, components, "project-demo.tsx")).default;
const demos = [["platform", platform], ["mecanum", mecanum], ["ticker", ticker]];
const results = [];
for (const cs of [false, true]) {
  const markup = renderToStaticMarkup(React.createElement("main", null, demos.map(([kind, Component]) => React.createElement(Component, { kind, cs, key: kind }))));
  assert.equal((markup.match(/<section /g) || []).length, 3);
  assert.ok(!/(?:NaN|Infinity|C:\\Users|TODO|\\project-research)/.test(markup));
  const ids = Array.from(markup.matchAll(/\bid="([^"]+)"/g), item => item[1]);
  assert.equal(ids.length, new Set(ids).size, "ID values must remain unique when all demos share a document");
  const set = new Set(ids);
  for (const match of markup.matchAll(/(?:aria-labelledby|aria-describedby|for)="([^"]+)"/g)) {
    for (const id of match[1].split(" ")) assert.ok(set.has(id), `Unresolved label ${id}`);
  }
  const closed = renderToStaticMarkup(React.createElement("main", null, demos.map(([kind]) => React.createElement(wrapper, { kind, cs, key: kind }))));
  assert.equal((closed.match(/aria-expanded="false"/g) || []).length, 3);
  assert.equal((closed.match(/ hidden=""/g) || []).length, 3);
  assert.ok(!closed.includes("<canvas") && !closed.includes("<svg") && !closed.includes("type=\"range\""), "Closed demos must not mount their contents");
  results.push(`${cs ? "CS" : "SK"}: 3 renders, unique labels, 3 initially unmounted demos`);
}

const renderer = inspectModule(components + "platform-renderer.ts", ["VIEWS", "unpack", "ring", "box"]);
const models = JSON.parse(fs.readFileSync(path.join(root, "public/projects/platform-meshes.json"), "utf8"));
for (const [key, count] of [["bottom", 19330], ["top-original", 25386], ["top-dual", 23832]]) {
  const vertices = renderer.unpack(key, models[key]);
  assert.equal(vertices.length / 9, count);
  assert.ok(vertices.every(Number.isFinite));
}
assert.throws(() => renderer.unpack("bottom", { ...models.bottom, scale: NaN }));
const bearing = renderer.ring(35, 60, 8.5);
let minRadius = Infinity, maxRadius = 0, maxZ = 0;
for (let i = 0; i < bearing.length; i += 3) {
  const radius = Math.hypot(bearing[i], bearing[i + 1]);
  minRadius = Math.min(minRadius, radius); maxRadius = Math.max(maxRadius, radius); maxZ = Math.max(maxZ, bearing[i + 2]);
}
assert.ok(Math.abs(minRadius - 35) < .00001 && Math.abs(maxRadius - 60) < .00001 && maxZ === 8.5);
const servo = renderer.box(40, 20, 40.5);
for (const [axis, size] of [[0, 40], [1, 20], [2, 40.5]]) {
  const coordinates = Array.from(servo).filter((_, i) => i % 3 === axis);
  assert.equal(Math.max(...coordinates) - Math.min(...coordinates), size);
}
const { VIEWS } = renderer;
assert.ok(Math.abs(VIEWS.back[0] - VIEWS.front[0] - Math.PI) < 1e-9);
assert.ok(Math.abs(VIEWS.front[0] - VIEWS.side[0] - Math.PI / 2) < 1e-9);
assert.ok(Math.abs(VIEWS.right[0] - VIEWS.front[0] - Math.PI / 2) < 1e-9);
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex");
assert.equal(hash("public/projects/platform-meshes.json"), "04160c6f3d30e6c532b0201261d2e062bc9d7674575a58cd59687e168266fbc7");
const showcase = fs.readFileSync(path.join(root, components, "project-showcase.tsx"), "utf8");
for (const [kind] of demos) assert.equal(showcase.split(`<ProjectDemo kind="${kind}"`).length - 1, 1, `${kind} must be wired exactly once`);
for (const kind of ["feeder", "blinds", "hologram", "fakturomat", "trendatlas", "rentulo", "imlayer"]) assert.ok(!showcase.includes(`<ProjectDemo kind="${kind}"`), `${kind} demo was removed`);
results.push("Actual STL triangle counts, finite coordinates, bearing/servo dimensions, orthogonal views, identical model asset, all project entries");
console.log("PASS: " + results.join("; ") + ".");
