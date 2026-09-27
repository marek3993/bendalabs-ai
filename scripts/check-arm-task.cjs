const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// Exercise the same geometry functions that drive the interactive scene.
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const geometry = require("../src/components/bendalabs/arm-geometry.ts");
const { poseAt } = require("../src/components/bendalabs/arm-motion.ts");
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

close(geometry.jawGap(geometry.TASK_GRIP_OPEN), geometry.TASK_CUBE_SIZE);
close(geometry.jawGap(0), 0);

let task = geometry.initialCubeTask();
const source = [...task.cube.origin];
const phases = [];
let heldSamples = 0;

for (let time = 0; time <= 10_300; time += 20) {
  const pose = poseAt(geometry.CUBE_DEMO, time);
  const safe = geometry.constrainCubePose(pose, task);
  assert.ok(safe, `Example cube collides with the surface at ${time} ms`);
  const previous = task;
  task = geometry.advanceCubeTask(task, safe, .02);
  if (phases.at(-1) !== task.phase) phases.push(task.phase);
  if (task.attachment) {
    heldSamples++;
    assert.ok(geometry.cubeBottom(task.cube) >= geometry.TASK_SURFACE_Y - 1e-6);
    if (!previous.attachment) {
      task.cube.origin.forEach((coordinate, axis) => close(coordinate, previous.cube.origin[axis]));
    }
  }
}

assert.equal(task.phase, "placed", "Continuous guided motion must complete the actual task");
assert.ok(task.lifted);
assert.ok(heldSamples > 100, "The cube must stay attached throughout the transfer");
close(task.cube.origin[0], geometry.TASK_TARGET.origin[0]);
close(task.cube.origin[2], geometry.TASK_TARGET.origin[2]);
close(geometry.cubeBottom(task.cube), geometry.TASK_SURFACE_Y);

// Moving an already closed gripper through the cube cannot acquire it.
let noGrab = geometry.initialCubeTask();
noGrab = geometry.advanceCubeTask(noGrab, [...geometry.TASK_APPROACH.slice(0, 5), geometry.TASK_GRIP_OPEN]);
noGrab = geometry.advanceCubeTask(noGrab, geometry.TASK_PICK);
assert.equal(noGrab.phase, "ready");
assert.equal(noGrab.attachment, null);

// A premature release drops the cube at its actual horizontal position.
let dropped = geometry.advanceCubeTask(geometry.initialCubeTask(), geometry.TASK_PICK);
assert.equal(dropped.phase, "holding");
const targetHover = [40, 25, 65, 90, 0, geometry.TASK_GRIP_OPEN];
dropped = geometry.advanceCubeTask(dropped, targetHover);
assert.ok(dropped.lifted);
const releasePosition = [dropped.cube.origin[0], dropped.cube.origin[2]];
const openAtHover = [...targetHover.slice(0, 5), 80];
dropped = geometry.advanceCubeTask(dropped, openAtHover);
assert.equal(dropped.phase, "falling");
dropped = geometry.advanceCubeTask(dropped, openAtHover, 2);
assert.equal(dropped.phase, "missed");
close(dropped.cube.origin[0], releasePosition[0]);
close(dropped.cube.origin[2], releasePosition[1]);

// Merely closing and opening at pickup height cannot pass the task.
let notLifted = geometry.advanceCubeTask(geometry.initialCubeTask(), geometry.TASK_PICK);
notLifted = geometry.advanceCubeTask(notLifted, [...geometry.TASK_PICK.slice(0, 5), 80], 2);
assert.equal(notLifted.phase, "missed");
assert.equal(notLifted.lifted, false);

// Gripping faces stop at contact; a carried cube cannot sink into the surface.
const held = geometry.advanceCubeTask(geometry.initialCubeTask(), geometry.TASK_PICK);
const closed = geometry.constrainCubePose([...geometry.TASK_PICK.slice(0, 5), 0], held);
assert.ok(closed);
close(closed[5], geometry.TASK_GRIP_OPEN);
assert.equal(geometry.constrainCubePose([-35, 45, 64, 71, 0, geometry.TASK_GRIP_OPEN], held), null);

// Reduced-motion steps must satisfy the same grasp, lift and placement rules.
let stepped = geometry.initialCubeTask();
for (const frame of geometry.CUBE_DEMO) {
  const safe = geometry.constrainCubePose(frame.pose, stepped);
  assert.ok(safe);
  stepped = geometry.advanceCubeTask(stepped, safe, 2);
}
assert.equal(stepped.phase, "placed");

console.log(JSON.stringify({
  status: "passed",
  scope: "arm geometry math; no browser",
  phases,
  heldSamples,
  gripOpening: geometry.TASK_GRIP_OPEN,
  source,
  target: task.cube.origin,
  checks: [
    "jaw gap matches cube", "continuous example reaches target", "no attachment jump",
    "no grab without closing", "release preserves horizontal position", "no success without lift",
    "grip stops at contact", "surface collision blocked", "reduced-motion stepped example",
  ],
}));
