import chalk from 'chalk';

export const throwNotLoadedError = () => {
  throw new Error(
    'The env set is not loaded. Make sure to call `await envSet.load()` before using it.'
  );
};

export const throwErrorWithDsnMessage = (error: unknown) => {
  const key = 'DB_URL';

  if (error instanceof Error && error.message === `env variable ${key} not found`) {
    console.error(
      `${chalk.red('[error]')} No Postgres connection configured in env variables.\n\n` +
        `  ${chalk.bold('Option 1')} — provide a full connection string:\n` +
        `    ${chalk.green(key)}=postgresql://user:password@host:5432/dbname\n\n` +
        `  ${chalk.bold('Option 2')} — provide individual AWS CDK DatabaseSecret fields:\n` +
        `    ${chalk.green('DB_HOST')}  ${chalk.green('DB_USERNAME')}  ${chalk.green('DB_PASSWORD')}  ${chalk.green('DB_NAME')}  ${chalk.dim('DB_PORT')} ${chalk.dim('(optional, default 5432)')}\n` +
        `    ${chalk.dim('DB_SSL_MODE')} ${chalk.dim('(optional, e.g. require or no-verify — needed for TLS-only databases)')}\n\n` +
        `  Either option can be set in the ${chalk.blue('.env')} file in the Logto project root.\n\n` +
        `  If you want to set up a new Logto database, run ${chalk.green(
          'npm run cli db seed'
        )} before connecting.\n\n` +
        `  Visit ${chalk.blue(
          'https://docs.logto.io/docs/references/core/configuration'
        )} for more info about setting up env.\n`
    );
  }

  throw error;
};
