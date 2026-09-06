# CHANGELOG

## v1.2.0
### Fixed
- **Build**: the frontend did not compile on Node ≥ 17 (`ERR_OSSL_EVP_UNSUPPORTED`)
  and failed under `CI=true` because of ESLint warnings. Upgraded to
  `react-scripts` 5, removed the hard `node 16.x` engine pin and fixed every
  warning (missing hook dependencies, unused imports, missing `key` props,
  duplicated element `id`s).
- **CI**: the workflow ran `npm ci` in the repository root where there is no
  `package.json`; it now builds/tests the frontend (yarn) and lints/tests the
  backend (flake8 + pytest).
- **Backend dependencies**: unpinned transitive packages broke the API on a
  fresh install (`Flask 2.2` + `Werkzeug 3` → `ImportError: url_quote`,
  `Flask-SQLAlchemy 3.0` + `SQLAlchemy 2` → incompatible). Versions are now
  pinned; the dead `mysql-connector` package and unused `aiohttp`/`joblib`
  were dropped.
- **Silent logout on every reload**: `isExpired()` compared `undefined` dates
  (the JWT payload was never JSON-parsed) and returned the inverted result, so
  a fresh token was discarded whenever it had more than 30 minutes left.
- **`GET /api/personal/donation` returned 500** for users that had not
  submitted yet (`None.__dict__`); it now returns an all-zero record so the
  request page loads for new users.
- **Partial submissions returned 500**: `DonationSchema` used the
  serialization `default=` instead of `load_default=`, so missing groups were
  `None` and violated the `NOT NULL` constraints.
- **Negative amounts were accepted** by the API (inflating the remaining
  budget); amounts are now validated to `0 … MAX_INVESTMENT`.
- Request page showed the *"Submit Success!"* dialog before/regardless of the
  server response (`sendRequest()` never returned anything); it now waits for
  the request and shows the server's error message on failure.
- Dashboard chart received `null` data on first render and had a fixed width
  of 1000 px (overflowed on small screens) → responsive container.
- Login input had `type="email"` although accounts are plain strings; the
  form now submits on Enter.
- The *Admin* navigation link was shown to everyone; it is now only rendered
  for the admin account. Unauthenticated users get a proper "please login"
  page on every protected route.
- Deprecated `@app.before_first_request` (removed in Flask 2.3) replaced.
- `find_latest_by_account` now uses `id` as tie breaker so two submissions in
  the same second are ordered deterministically.
- docker-compose: removed the hard-coded `/home/kaminyou` volume mount and
  stale Celery/Redis variables, added a persistent MySQL volume; `create_user.sql`
  is idempotent; nginx no longer ships the commented-out PHP boilerplate.
- CSS `@import` moved to the top of the stylesheet (it was ignored below other
  rules); mobile navigation (hamburger) added; pages scroll to top on
  navigation.
### Changed
- Dashboard/admin/personal pages no longer poll the API every 2 seconds; the
  dashboard refreshes every `REFRESH_DURATION` (10 s), the other pages on load.
- Removed nine unused frontend dependencies (`@material-ui/*`, `material-table`,
  `react-table`, `react-select`, `bootstrap-fileinput`, …).
- Backend: shared `constants.py` (group list / `MAX_INVESTMENT`), test suite
  (`backend/tests`), README rewritten with dev/prod instructions and an API table.

## v1.0.0
- Initial version
