# `@vercel/ncc` patches

### [@vercel+ncc+0.38.1+001+typescript-6-rootdir.patch](@vercel+ncc+0.38.1+001+typescript-6-rootdir.patch)

- Reason:

    ```
    TypeScript 6 fails `npm run gh-actions-build` because ncc's bundled
    ts-loader calls `transpileModule` with `rootDir: undefined`, which strips
    the explicit `rootDir` from `.github/tsconfig.json` and triggers TS5011.
    This patch removes that override so ncc respects the configured rootDir
    while bundling GitHub Action scripts.
    ```

- Upstream PR/issue: https://github.com/vercel/ncc/pull/1316
- E/App issue: N/A
- PR introducing patch: N/A
