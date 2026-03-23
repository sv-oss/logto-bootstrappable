import conventional from '@commitlint/config-conventional';
import { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [...conventional.rules['type-enum'][2], 'api', 'release']],
    'scope-case': [2, 'always', 'pascal-case'],
    'scope-enum': [2, 'always', ['Connector', 'Console', 'Core', 'DemoApp', 'Test', 'Phrases', 'Schemas', 'Shared', 'Experience', 'ExperienceLegacy', 'Deps', 'DepsDev', 'Cli', 'Toolkit', 'Cloud', 'AppInsights', 'Elements', 'Translate', 'Tunnel', 'AccountElements', 'Account', 'Api']],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'always', ['sentence-case', 'lower-case']],
    'body-full-stop': [0, 'never', '.'],
    'subject-full-stop': [0, 'never', '.'],
  },
};

export default config;
