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

Piston ships with no languages installed. C **and** C++ both come from the
single `gcc` package; Java and Python are their own. Install the three
packages this platform needs:

```bash
curl -s http://localhost:2000/api/v2/packages           # list available versions

for pkg in \
  '{"language":"python","version":"3.12.0"}' \
  '{"language":"java","version":"15.0.2"}' \
  '{"language":"gcc","version":"10.2.0"}'; do
  curl -s -XPOST http://localhost:2000/api/v2/packages \
    -H 'Content-Type: application/json' -d "$pkg"
done

curl -s http://localhost:2000/api/v2/runtimes           # confirm: python, java, c, c++
```

Downloads come from GitHub release assets. If a download hangs or the
container crashes mid-install, it's usually one bad IP in GitHub's Fastly
anycast set — the `dns:` and `extra_hosts:` pins in the root
`docker-compose.yml` work around it. Just re-run the install.

The `execute` API takes the language name (`c`, `c++`, `java`, `python`) —
only package *installs* use `gcc`. `judge.service.js` already maps our
`tracks.judge_language` values to the right runtime.

## Isolation notes

- `privileged: true` is required for Piston's `nsjail` sandboxing.
- Per-run CPU/mem/time limits are set by the backend on each request
  (`JUDGE_RUN_TIMEOUT_MS`, `run_memory_limit`).
- Keep the container on its own network; the backend only needs port 2000.
- Alternative: swap the image for Judge0. If you do, replace `judge.service.js`
  with a Judge0 client — the rest of the code depends only on
  `runAgainstCases()` / `runOnce()`.
