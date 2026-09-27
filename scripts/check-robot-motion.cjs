const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Run the actual TypeScript modules with the project's existing compiler.
for (const extension of [".ts", ".tsx"]) require.extensions[extension] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { appendFrame, clampPose, HOME_POSE, JOINTS, MAX_RECORDING_MS, PARK_POSE, poseAt, playbackTime } = require("../src/components/bendalabs/arm-motion.ts");
const { armFrames, buildArm, projectPoint } = require("../src/components/bendalabs/arm-geometry.ts");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
const recording = [];
const a = [...HOME_POSE], b = [40, -12, 38, 60, 130, 5];
appendFrame(recording, 0, a);
appendFrame(recording, 1000, a); // One second hold before motion.
appendFrame(recording, 2000, b);
appendFrame(recording, 3000, b); // One second hold after motion.
a[0] = 99;
assert.equal(recording[0].pose[0], HOME_POSE[0], "Snapshots must not retain mutable pose references");
assert.deepEqual(poseAt(recording, 500), HOME_POSE, "Initial hold must be preserved");
assert.deepEqual(poseAt(recording, 2500), b, "Final hold must be preserved");
poseAt(recording, 1500).forEach((value, i) => close(value, (HOME_POSE[i] + b[i]) / 2));
assert.deepEqual(poseAt(recording, -200), HOME_POSE);
assert.deepEqual(poseAt(recording, 99999), b);
const copied = poseAt(recording, 1000); copied[0] = 101;
assert.equal(recording[1].pose[0], HOME_POSE[0]);
const count = recording.length;
appendFrame(recording, 3000, HOME_POSE);
assert.equal(recording.length, count, "Equal timestamps must not create division by zero");
appendFrame(recording, 99999, b);
assert.equal(recording.at(-1).time, MAX_RECORDING_MS);
assert.equal(playbackTime(1000, 500, .5, 3000), 1250, "Resume must preserve cursor and apply speed");
assert.equal(playbackTime(1000, 500, 2, 3000), 2000);
assert.equal(playbackTime(2000, 1000, 2, 3000), 3000, "Playback ends exactly at the last frame");
const limited = clampPose([NaN, 1000, -1000, Infinity, -999, 300]);
limited.forEach((value, i) => assert.ok(Number.isFinite(value) && value >= JOINTS[i].min && value <= JOINTS[i].max));

const mesh = buildArm(HOME_POSE);
for (let joint = 0; joint < 6; joint++) {
  const pose = [...HOME_POSE]; pose[joint] += 20;
  const changed = buildArm(pose);
  assert.equal(changed.length, mesh.length);
  assert.notDeepEqual(changed, mesh, `Joint ${joint + 1} must change visible geometry`);
}
const yaw = [...HOME_POSE]; yaw[0] = 80;
const roll = [...HOME_POSE]; roll[4] = 120;
assert.notDeepEqual(armFrames(yaw).wrist.origin, armFrames(HOME_POSE).wrist.origin);
assert.deepEqual(armFrames(roll).tool.origin, armFrames(HOME_POSE).tool.origin, "Wrist roll rotates the tool without translating its axis");
assert.notDeepEqual(armFrames(roll).tool.x, armFrames(HOME_POSE).tool.x);
for (const pose of [HOME_POSE, PARK_POSE, JOINTS.map(j => j.min), JOINTS.map(j => j.max)]) {
  const frame = armFrames(pose);
  for (const [from, to, distance] of [[frame.shoulder, frame.elbow, 153], [frame.elbow, frame.wrist, 107], [frame.wrist, frame.tool, 62]]) {
    close(Math.hypot(...from.origin.map((n, i) => n - to.origin[i])), distance);
  }
  for (const view of ["perspective", "side", "top"]) {
    buildArm(pose).forEach(face => face.points.forEach(p => Object.values(projectPoint(p, view)).forEach(n => assert.ok(Number.isFinite(n)))));
  }
}
const extended = buildArm([0, 0, 0, 0, 0, 0]).flatMap(face => face.points);
const height = Math.max(...extended.map(p => p[1]));
assert.ok(height >= 503 && height <= 506, "Extended model should match the 505 mm supplied reference");

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ArmModel = require("../src/components/bendalabs/arm-model.tsx").default;
const MotionStudy = require("../src/components/bendalabs/motion-study.tsx").default;
for (const locale of ["sk", "cs"]) {
  const markup = renderToStaticMarkup(React.createElement(MotionStudy, { locale }));
  assert.equal((markup.match(/type="range"/g) || []).length, 7, "Six joint inputs plus the recording timeline");
  assert.ok(markup.includes(locale === "sk" ? "Nahrať pohyb" : "Nahrát pohyb"));
  assert.ok(markup.includes(locale === "sk" ? "Simulácia v prehliadači" : "Simulace v prohlížeči"));
  assert.ok(!markup.includes("NaN") && !markup.includes("Infinity"));
}
console.log("PASS: six-axis geometry, fixed link lengths, dimensions, recording timing, interpolation, holds, bounds, speed/resume and SK/CS controls.");

if (process.argv.includes("--render")) {
  const sharp = require("sharp");
  const directory = path.resolve(__dirname, "../review/robot-motion");
  fs.mkdirSync(directory, { recursive: true });
  const variants = [
    ["home", HOME_POSE, "perspective"], ["side", HOME_POSE, "side"],
    ["top", HOME_POSE, "top"], ["park", PARK_POSE, "perspective"],
    ["extended", [0, 0, 0, 0, 0, 0], "perspective"],
    ["rotated", [65, 30, -45, 20, 95, 100], "perspective"],
  ];
  Promise.all(variants.map(async ([name, pose, view]) => {
    const markup = renderToStaticMarkup(React.createElement(ArmModel, { pose, view, cs: false }));
    const svg = markup.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    await sharp(Buffer.from(svg)).resize(900, 705).png().toFile(path.join(directory, name + ".png"));
  })).then(() => console.log("Rendered isolated SVG model variants for geometry review (not browser screenshots)."));
}
