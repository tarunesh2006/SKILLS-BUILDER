# Judge engine (Piston)

Submitted student code for the 4 coding tracks (C, C++, Java, Python) runs
**only** inside the Piston container defined in the repo-root `docker-compose.yml`.
The Express backend never executes untrusted code in its own process — it makes
HTTP calls to `http://localhost:2000/api/v2/execute`.

## Bring it up

```bash
docker compose up -d piston
```

## Install language runtimes (one-time)

Piston ships with no languages installed. Install the four this platform uses:

```bash
curl -s http://localhost:2000/api/v2/packages           # list available
for lang in c cpp java python; do
  case $lang in
    c)      pkg='{"language":"c","version":"*"}';;
    cpp)    pkg='{"language":"c++","version":"*"}';;
    java)   pkg='{"language":"java","version":"*"}';;
    python) pkg='{"language":"python","version":"*"}';;
  esac
  curl -s -XPOST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d "$pkg"
done
```

(You can pin exact versions instead of `*` — update `LANG` in
`backend/src/services/judge.service.js` to match.)

## Isolation notes

- `privileged: true` is required for Piston's `nsjail` sandboxing.
- Per-run CPU/mem/time limits are set by the backend on each request
  (`JUDGE_RUN_TIMEOUT_MS`, `run_memory_limit`).
- Keep the container on its own network; the backend only needs port 2000.
- Alternative: swap the image for Judge0. If you do, replace `judge.service.js`
  with a Judge0 client — the rest of the code depends only on
  `runAgainstCases()` / `runOnce()`.
