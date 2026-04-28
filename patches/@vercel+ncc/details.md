# `@vercel/ncc` patches

### [@vercel+ncc+0.38.1+001+typescript-6-rootdir-single-file.patch](@vercel+ncc+0.38.1+001+typescript-6-rootdir-single-file.patch)

- Reason:

    ```
    TypeScript 6 fails `npm run gh-actions-build` because ncc's bundled
    ts-loader calls `transpileModule` with `rootDir: undefined`, which strips
    the explicit `rootDir` from `.github/tsconfig.json` and triggers TS5011.
    This patch removes that override so ncc respects the configured rootDir.
    It also forces ncc to emit a single chunk because our GitHub Actions
    workflow expects each JavaScript action to be a self-contained `index.js`
    file.
    ```

- Upstream PR/issue: https://github.com/vercel/ncc/pull/1316
- E/App issue: N/A
- PR introducing patch: N/A
