# Continuous integration

`github-actions-ci.yml` runs `npm run verify` (typecheck, lint, and the six
logic gates) plus a production build on every push and pull request.

**It isn't installed yet.** The GitHub App used to push this branch doesn't hold
the `workflows` permission, so it can't create files under `.github/workflows/`.
Installing it takes about thirty seconds:

**Option A — in the GitHub UI**
1. Go to the repo → **Add file** → **Create new file**
2. Name it `.github/workflows/ci.yml`
3. Paste the contents of `docs/ci/github-actions-ci.yml`
4. Commit

**Option B — locally**
```bash
mkdir -p .github/workflows
cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "Add CI" && git push
```

Once it's in place, every pull request reports whether the gates pass before
anything reaches main.
