import conventional from '@commitlint/config-conventional';
import { UserConfig } from '@commitlint/types';

const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

const upstreamScopes = [
  'connector',
  'console',
  'core',
  'demo-app',
  'test',
  'phrases',
  'schemas',
  'shared',
  'experience',
  'experience-legacy',
  'deps',
  'deps-dev',
  'cli',
  'toolkit',
  'cloud',
  'app-insights',
  'elements',
  'translate',
  'tunnel',
  'account-elements',
  'account',
  'api',
] as const;

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [...conventional.rules['type-enum'][2], 'api', 'release']],
    'scope-case': [2, 'always', ['pascal-case', 'lower-case', 'kebab-case', 'upper-case']],
    // Preserve the PascalCase scopes used by the historical fork commits.
    'scope-enum': [2, 'always', [...upstreamScopes, 'AC', 'Core', 'UI', 'master']],
    ...(isCi && { 'header-max-length': [2, 'always', 110] }),
    ...(isCi && { 'footer-max-line-length': [2, 'always', 110] }),
    'body-max-line-length': [2, 'always', 110],
    // Historical upstream commits include sentence-case subjects that end with a period.
    'subject-case': [0, 'always', ['sentence-case', 'lower-case']],
    'subject-full-stop': [0, 'never', '.'],
  },
};

export default config;
