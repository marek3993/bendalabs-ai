import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const file = new URL("../src/components/bendalabs/mecanum-scene.ts", import.meta.url);
const js = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
const geometry = { exports: {} };
const geometryFile = new URL('../src/components/robotics-university/lib/bendalabs-rover-geometry.ts', import.meta.url);
const geometryJs = ts.transpileModule(fs.readFileSync(geometryFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
vm.runInNewContext(geometryJs, { exports: geometry.exports, module: geometry, Math, Float32Array });
vm.runInNewContext(js, { exports: loaded.exports, module: loaded, Math, Float32Array, require(name) {
  assert.equal(name, '@/components/robotics-university/lib/bendalabs-rover-geometry');
  return geometry.exports;
} });
const { advanceDrive, advanceDriveHold, releaseDriveHold, driveCanvasSize, initialDrivePose, wheelSpeeds, DRIVE_ARENA, DRIVE_ENVELOPE, DRIVE_PARK, headingDifference, crossesCheckpoint, isParked } = loaded.exports;
const close = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-8, `${message}: ${a} versus ${b}`);
const pose = { ...initialDrivePose(), x: 0, y: 0 };
const forward = { forward: 1, strafe: 0, turn: 0 };
const right = { forward: 0, strafe: 1, turn: 0 };
close(advanceDrive(pose, forward, .05, 2).y, .1, "Forward follows +y");
close(advanceDrive(pose, right, .05, 2).x, .1, "Strafe follows +x");
close(advanceDrive({ ...pose, yaw: Math.PI / 2 }, forward, .05, 2).x, -.1, "Forward rotates with heading");
close(advanceDrive({ ...pose, yaw: Math.PI / 2 }, right, .05, 2).y, .1, "Strafe rotates with heading");
const diagonal = advanceDrive(pose, { ...forward, strafe: 1 }, .05, 2);
close(Math.hypot(diagonal.x, diagonal.y), .1, "Diagonal motion has the same translation speed");
close(advanceDrive(pose, forward, 5, 2).y, .1, "Elapsed time is capped after interruption");
close(advanceDrive(pose, forward, -1, 2).y, 0, "Negative elapsed time is ignored");
assert.deepEqual(Array.from(wheelSpeeds(1, 0, 0)), [1, 1, 1, 1]);
assert.deepEqual(Array.from(wheelSpeeds(0, 1, 0)), [1, -1, -1, 1]);
assert.deepEqual(Array.from(wheelSpeeds(0, 0, 1)), [-1.3, 1.3, -1.3, 1.3]);
close(headingDifference(179 * Math.PI / 180, -179 * Math.PI / 180), -2 * Math.PI / 180, "Heading wraps across ±180°");

function checkBounds(p) {
  for (const x of [-DRIVE_ENVELOPE.x, DRIVE_ENVELOPE.x]) for (const y of [-DRIVE_ENVELOPE.y, DRIVE_ENVELOPE.y]) {
    const wx = p.x + x * Math.cos(p.yaw) - y * Math.sin(p.yaw);
    const wy = p.y + x * Math.sin(p.yaw) + y * Math.cos(p.yaw);
    assert.ok(Math.abs(wx) <= DRIVE_ARENA.x + 1e-9 && Math.abs(wy) <= DRIVE_ARENA.y + 1e-9, "Every rotated corner stays inside the arena");
  }
}
for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
  let p = { ...pose, x: sx * (DRIVE_ARENA.x - DRIVE_ENVELOPE.x), y: sy * (DRIVE_ARENA.y - DRIVE_ENVELOPE.y) };
  for (let i = 0; i < 1000; i++) { p = advanceDrive(p, { forward: sy, strafe: sx, turn: 1 }, 1 / 60, 2.6); checkBounds(p); }
}
let p30 = pose, p120 = pose;
for (let i = 0; i < 30; i++) p30 = advanceDrive(p30, forward, 1 / 30, 1);
for (let i = 0; i < 120; i++) p120 = advanceDrive(p120, forward, 1 / 120, 1);
close(p30.y, p120.y, "Distance is independent of render frame rate");
assert.equal(crossesCheckpoint({ ...pose, x: -2 }, { ...pose, x: 2 }, [0, 0]), true, "Crossing a circle cannot skip it");
assert.equal(crossesCheckpoint({ ...pose, y: 2 }, { ...pose, x: 2, y: 2 }, [0, 0]), false);
const parked = { ...pose, ...DRIVE_PARK };
assert.equal(isParked(parked, 0), false, "Parking requires the route checkpoints");
assert.equal(isParked(parked, 2), true);
assert.equal(isParked({ ...parked, yaw: Math.PI / 2 }, 2), false, "Parking requires the matching heading");
assert.equal(isParked({ ...parked, x: parked.x + 1 }, 2), false, "Parking requires the bay center");
let tap = releaseDriveHold({ elapsed: 0, released: false });
let tapPose = pose, tapFrames = 0;
while (tap) { tapPose = advanceDrive(tapPose, right, 1 / 60, 1.65); tap = advanceDriveHold(tap, 1 / 60); tapFrames++; assert.ok(tapFrames < 10); }
assert.ok(tapPose.x >= .18 && tapPose.x < .22, "A tap before the first RAF produces a visible, bounded step");
assert.equal(releaseDriveHold({ elapsed: 1, released: false }), null, "Releasing a long hold adds no extra movement");
assert.equal(releaseDriveHold({ elapsed: 0, released: false }, false), null, "Cancellation never queues a tap");
assert.equal(advanceDriveHold({ elapsed: .1, released: false }, 1 / 60)?.released, false, "An active hold does not expire");
assert.equal(driveCanvasSize(1000, 530, 2).width, 2000, "Bitmap resolution follows the CSS container");
for (const [w, h] of [[26_843_544, 26_843_546], [100_000_000, 1], [1, 100_000_000], [1920, 1080]]) {
  const size = driveCanvasSize(w, h, 2);
  assert.ok(size.width <= 4096 && size.height <= 4096 && size.width * size.height <= 6_000_000, "Unexpected container dimensions cannot create an unbounded canvas");
}
assert.equal(driveCanvasSize(0, 530, 2).width, 0, "A hidden container does not allocate a bitmap");
console.log("Mecanum math passed: directions, four wheels, delta time, 4,000 boundary frames, checkpoints, parking, short taps and bounded canvas resolution.");
