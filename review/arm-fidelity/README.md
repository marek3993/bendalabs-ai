# Robot arm reference update — 27 September 2026

The upper mechanism follows the supplied pre-platform photograph (reference-original-arm.png). The current robot-arm.jpeg and robot-arm-base.jpeg remain the references for the custom raised circular bearing platform; the original rectangular commercial base was not restored.

Changed geometry: thin mirrored metal jaws, two pivoted links per finger, separate follower pivots, jaw rotation compensation, visible mounting screws, servo housings and horns, perforated paired arm brackets, silver connecting shaft and routed servo wires. Removed the unsupported mint contact pads. The base now has a raised support structure consistent with the current prototype and the available platform envelope.

Joint link offsets and the concealed construction remain illustrative estimates from the photographs. This is an interactive visual model, not calibrated manufacturing CAD or hardware control. No new hardware capability is implied.

The gripper contact frame and cube clearance are preserved; the updated regression checks cover both linkage pivot coincidence and parallel jaws across openings and rotated poses. Bounds calculation now streams the detailed example geometry to avoid exceeding the browser's function argument limit. The SVG fits the actual existing panel dimensions with ResizeObserver, so desktop space is used without changing the page layout or copy.

Review files: before-after.png compares isolated renders at the same initial pose. desktop.png, mobile.png, small-mobile.png and model-*.png show the actual browser. browser-results.json records viewport, input, recording/playback and cube-transfer checks. Run browser-check.cjs with CDP_URL pointing to the agent-browser session; the local preview is port 3101.

Prepared with the pending photo follow-up in C:/Projects/BendaLabs-photos-20260927. No production deployment performed by this update.
