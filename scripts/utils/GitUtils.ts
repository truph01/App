import {execSync} from 'node:child_process';

/**
 * Small git helpers for scripts (rev-parse, etc.).
 */
const GitUtils = {
    /**
     * Abbreviated hash for `HEAD` in the current working directory.
     *
     * @returns Short commit hash, or `unknown` when not a git repo or git fails.
     */
    getHeadShort(): string {
        try {
            return execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
        } catch {
            return 'unknown';
        }
    },
};

export default GitUtils;
