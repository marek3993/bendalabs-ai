# Robotics University learning flow

Updated 6 October 2026. Integrated onto `526cd18` so the automation landing,
conversion tracking, private lead storage, localization and SEO stay intact.

## Learning and progress

The default entry is `#start`. Five rover missions contain one demonstration
and four assessed tasks. A task requires a successful simulated route. Completion is recorded immediately;
a clear next-task action is shown beside the result. Binary reflection and
prediction gates were removed from rover missions and all six lab challenges. Command limits count emitted actions, including actions in loops.
Five parameter challenges assess PID, LiDAR, runtime, arm position and gearing.
A sixth challenge simulates vertical drone landings, first at 1 kg and then
with a 0.4 kg payload. They use bounded inputs and numerical criteria; these simplified
models do not certify a physical robot.

`robotics-journey-v2` stores practical achievements; existing chapter quizzes
remain in `robotics-atlas-v1`. JSON export/import merges recognized achievements,
chapter progress, builder steps and rover drafts without requiring an account.
The demonstration does not count as a practical skill.

The 3D explorer has an animated 2D alternative. The new entry and guided
challenges work without WebGL. Free-form laboratory controls load on expansion.

## Private student support

The native wrapper supplies `SupportForm` to the start page and `#support`.
Only one form is mounted at a time. Requests go through
`/api/university-support` to the existing authenticated `university-feedback`
Edge bridge, using the existing server-only environment variables.

The approved isolated storage is `university_student_support` and
`university_support_rate_limits`; migration source is
`supabase/university-student-support.sql`. Public reads are revoked. Submission
uses bounded validation, a consent field, idempotency and rate limits.
`/admin/university/questions` uses the existing administrator authentication.
Replies are manual; the site does not promise an automated reply or response time.
Chapter ratings and suggestions remain separate and unchanged.

## Content provenance and limits

The workshop photo is the genuine existing BendaLabs Mecanum chassis image,
captioned as inspiration rather than the two-wheel Uno tutorial assembly.
No authentic workshop video was available in the accessible source assets.
The shopping list includes dated manufacturer prices and an editable example
exchange rate. ROS 2 Jazzy and PX4 v1.17.0 instructions were checked against
primary documentation, not executed on physical hardware or an Ubuntu machine.
News remains a dated curated selection, with sources and related chapters.

## Checks

```sh
npm test
npm run build
node scripts/check-automation.cjs --api-only
npm run test:leads
node --test scripts/university-feedback.test.cjs scripts/university-support.test.cjs
node scripts/university-learning-journey.mjs
npx tsc --noEmit
```

The learning-journey regression has 67 independent checks, including continuous
collision geometry, invalid starts, command-budget boundaries, challenge
solutions and progress validation. Browser verification covers all five rover
missions, all six challenges, an infinite-loop timeout, SK/EN, inline chapter
navigation, mobile layouts and transfer into a clean browser origin.

The source Site is maintained separately. Its verified source revision is
`b841a4d`. Its exporter scopes CSS and copies
the application into `src/components/robotics-university`; preserve the native
wrapper, feedback/support components and integration stylesheet on export.

The rover runner iframe mounts after client hydration. A cold production load
was verified through the demo, the first assessed task and the next-task action;
it must not depend on an iframe load event emitted before React attaches.

## Language review

Reviewed both languages across all 24 chapters, five rover missions, six assessed
labs, 18 chapter-specific experiments, three build guides and interface copy.
Hints now state angles, units, clearance and command-counting rules. Removed
vague motivational filler and patronizing feedback. PID controls name the
actual gains; the drone description distinguishes acceleration from altitude.
Numerical criteria, quiz answer keys, sources and safety guidance remain intact.

The source TypeScript check and both production builds passed. The revised
mission-four hint was checked in Slovak and English in the browser.

## Drone landing exercise

Replaces the static tilted-force task at every entry point with animated vertical
flight. Throttle changes actual height and velocity; ground contact records the
impact speed before stopping. Landings at or below 0.8 m/s earn the existing
vertical-flight skill. Legacy progress never displays a landing verdict.
The next action opens the payload task, then the flight chapter.

The bounded model uses motor lag, 120 Hz substeps and half-speed playback.
Hidden tabs pause automatically; pausing preserves velocity and motor state.
Equations and model limitations are optional below the controls. The detailed
thrust/tilt experiment remains available separately.

Verified with 67 independent checks and browser interaction: hard impact, pause,
keyboard throttle, a 0.65 m/s landing, continuation to the 1.4 kg task, and mobile
visibility of the drone/pad and brake controls.


## Arm transfer exercise

The kinematics challenge now reuses the detailed three-dimensional RobotScene arm.
The user grips a part at A, raises it by at least 15 cm, and places it at B within
2 cm. No prediction question or quiz gates the controls. Each stage has a concrete
handling action and a live distance/height readout; success leads to the IK chapter.

The measurement point is the centre between the jaws, 0.92 scene units from the
wrist. Wrist compensation keeps the gripper pointing down, and base yaw rotates
both the tool calculation and model. Scale: 20 cm per scene unit. This is a
position/sequence task, not a full collision or dynamics simulation.

Independent tests compare the analytical tool position to nested Three.js world
transforms and cover invalid inputs, remote gripping/placing, lift height and yaw.
Browser checks cover sequential negative-angle typing, each stage, failed actions,
completion/navigation, SK/EN, mobile controls and the optional 2D fallback.

A deterministic bundled revision is compared with a no-store public manifest on
mount/focus and while visible. A mismatch offers an explicit reload; it never
interrupts an experiment automatically. Saved progress and rover drafts remain in
storage. Existing tabs loaded before this mechanism need one manual refresh.
The source prebuild regenerates both revision files; export copies them together.
