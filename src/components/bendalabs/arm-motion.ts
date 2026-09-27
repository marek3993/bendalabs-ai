export type ArmPose = [number, number, number, number, number, number];
export type MotionFrame = { time: number; pose: ArmPose };

// Illustrative joint ranges, not the calibration or safety limits of the hardware.
export const JOINTS = [
  { sk: "Základňa", cs: "Základna", min: -100, max: 100, unit: "°" },
  { sk: "Rameno", cs: "Rameno", min: -55, max: 65, unit: "°" },
  { sk: "Lakeť", cs: "Loket", min: -100, max: 80, unit: "°" },
  { sk: "Náklon zápästia", cs: "Náklon zápěstí", min: -90, max: 90, unit: "°" },
  { sk: "Rotácia zápästia", cs: "Rotace zápěstí", min: -180, max: 180, unit: "°" },
  { sk: "Otvorenie chápadla", cs: "Otevření chapadla", min: 0, max: 100, unit: "%" },
] as const;

export const HOME_POSE: ArmPose = [0, 24, -52, -22, 0, 55];
export const PARK_POSE: ArmPose = [0, 48, -96, -62, 0, 15];
export const MAX_RECORDING_MS = 60_000;
export const SAMPLE_INTERVAL_MS = 50;

export function clampPose(pose: ArmPose): ArmPose {
  return pose.map((value, index) => Math.min(JOINTS[index].max,
    Math.max(JOINTS[index].min, Number.isFinite(value) ? value : HOME_POSE[index]))) as ArmPose;
}

export function appendFrame(frames: MotionFrame[], time: number, pose: ArmPose): void {
  const previous = frames.at(-1);
  const frame = { time: Math.min(MAX_RECORDING_MS, Math.max(previous?.time ?? 0, time)), pose: [...pose] as ArmPose };
  if (previous?.time === frame.time) frames[frames.length - 1] = frame;
  else frames.push(frame);
}

export function poseAt(frames: readonly MotionFrame[], time: number): ArmPose {
  if (!frames.length) return [...HOME_POSE];
  if (time <= frames[0].time) return [...frames[0].pose];
  const last = frames[frames.length - 1];
  if (time >= last.time) return [...last.pose];
  let low = 0, high = frames.length - 1;
  while (low + 1 < high) {
    const middle = (low + high) >>> 1;
    if (frames[middle].time <= time) low = middle;
    else high = middle;
  }
  const a = frames[low], b = frames[high];
  const weight = (time - a.time) / (b.time - a.time);
  return a.pose.map((value, index) => value + (b.pose[index] - value) * weight) as ArmPose;
}

export function playbackTime(start: number, elapsed: number, speed: number, duration: number) {
  return Math.min(duration, Math.max(0, start + elapsed * speed));
}

export function formatTime(time: number): string {
  const tenths = Math.floor(time / 100);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}
