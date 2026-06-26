# Playwright test URLs

Goal: build URLs **the same way the project's own Playwright setup builds them**, instead of hardcoding a host table. Run this only when the diff modifies a `**/*.spec.{js,ts}`.

## 1. Find the base URL pattern

In order, look for:

1. **Playwright config** (`playwright.config.{js,ts,mjs,cjs}` at repo root or under `tests/`). Read it and extract:
   - `use.baseURL` (string or expression)
   - per-project `use.baseURL` if `projects: [...]` is used (one base URL per area/site)
   - `webServer.url` as a fallback
2. **Environment helper** the tests use (e.g. a `navigateTo(page, path)` helper). Open it (`grep -rE "navigateTo\s*=|export.*navigateTo" tests/ playwright/ -l`) and read how it composes the URL (host template, port, query handling).
3. **An existing passing spec** in the repo (not necessarily one being modified). Extract a real `page.goto('https://…')` to see the concrete pattern.

Record the discovered pattern as `BASE_URL_TEMPLATE` (may contain a `{site}` / `{area}` slot) and a `PORT`. Note any per-area exceptions you actually observe in the config — do **not** invent any.

## 2. Extract the path from each modified spec

For each modified `**/*.spec.{js,ts}`:

```bash
grep -nE "navigateTo\(\s*page\s*,\s*['\"]|page\.goto\(\s*['\"]" <spec>
```

- Take the **first** path in the top-level / `Desktop` describe block (or the first call if no describe split).
- Keep any query string (`?todayDate=…`, etc.) verbatim.

## 3. Build the final URL

- If the spec calls `page.goto('https://…')` directly, **use that URL as-is**.
- Otherwise, substitute the path into the discovered `BASE_URL_TEMPLATE`, using the area detected in §4 for the `{site}`/`{area}` slot.
- Apply only exceptions you saw in the project's own config (e.g. a host alias like `foo → bar` if and only if it's encoded in playwright.config or the test helper).
