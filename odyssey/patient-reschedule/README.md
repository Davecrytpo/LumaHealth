# Harbor task: patient reschedule

Odyssey / Harbor bundle. The agent sees `instruction.md` and a container whose `/app` is `healthy-baseline-v1` with `environment/regression.patch` applied.

The healthy application tag `healthy-baseline-v1` (`3d4feec`) is not modified.

Do not submit this bundle until the author has signed off.

## Layout

```
instruction.md                 # product-language task
task.toml                      # Harbor metadata
environment/Dockerfile
environment/app.tar.gz         # git archive of healthy-baseline-v1 (app only)
environment/regression.patch   # starting-state defect
solution/solve.sh              # restores the two healthy files
solution/patient.ts
solution/BookingFlow.tsx
tests/test.sh                  # writes /logs/verifier/reward.txt
tests/hidden-reschedule.test.ts
```

## Local checks (no Docker)

Hidden tests are copied to `server/hidden-reschedule.test.ts` only for the run, then deleted.

Broken start (must fail):

```bash
git apply odyssey/patient-reschedule/environment/regression.patch
cp odyssey/patient-reschedule/tests/hidden-reschedule.test.ts server/hidden-reschedule.test.ts
npx vitest run server/hidden-reschedule.test.ts --testTimeout=20000
# expect non-zero
git checkout -- server/routes/patient.ts src/pages/patient/BookingFlow.tsx
rm server/hidden-reschedule.test.ts
```

Reference solution (must pass):

```bash
APP_DIR=. bash odyssey/patient-reschedule/solution/solve.sh
cp odyssey/patient-reschedule/tests/hidden-reschedule.test.ts server/hidden-reschedule.test.ts
npx vitest run server/hidden-reschedule.test.ts --testTimeout=20000
npm test
rm server/hidden-reschedule.test.ts
```

## Harbor

```bash
harbor run -p odyssey/patient-reschedule -a oracle
```
