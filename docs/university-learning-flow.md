# Robotics University learning flow

Updated 6 October 2026. Integrated onto `526cd18` so the automation landing,
conversion tracking, private lead storage, localization and SEO stay intact.

## Learning and progress

The default entry is `#start`. Five rover missions contain one demonstration
and four assessed tasks. A task requires a successful simulated route. Completion is recorded immediately;
a clear next-task action is shown beside the result. Binary reflection and
prediction gates were removed from rover missions and all six lab challenges. Command limits count emitted actions, including actions in loops.
Six further challenges assess PID, LiDAR, runtime, arm position, vertical thrust
and gearing. They use bounded inputs and numerical criteria; these simplified
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

The learning-journey regression has 64 independent checks, including continuous
collision geometry, invalid starts, command-budget boundaries, challenge
solutions and progress validation. Browser verification covers all five rover
missions, all six challenges, an infinite-loop timeout, SK/EN, inline chapter
navigation, mobile layouts and transfer into a clean browser origin.

The source Site is maintained separately. Its verified source revision is
`d47b84a`. Its exporter scopes CSS and copies
the application into `src/components/robotics-university`; preserve the native
wrapper, feedback/support components and integration stylesheet on export.

The rover runner iframe mounts after client hydration. A cold production load
was verified through the demo, the first assessed task and the next-task action;
it must not depend on an iframe load event emitted before React attaches.
