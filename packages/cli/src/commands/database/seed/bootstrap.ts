import { type DatabaseTransactionConnection } from '@silverhand/slonik';

import { consoleLog } from '../../../utils.js';

import { bootstrapAdminUser } from './bootstrap-admin.js';
import { bootstrapApplication, bootstrapM2mApplication } from './bootstrap-apps.js';
import {
  getAdminConfig,
  getAppConfig,
  getM2mConfig,
  getMfaConfig,
  getSignInExperienceConfig,
  getSmtpConfig,
  getSmtpSmsConfig,
} from './bootstrap-config.js';
import { bootstrapSmtpConnector, bootstrapSmtpSmsConnector } from './bootstrap-connectors.js';
import {
  bootstrapAccountCenter,
  bootstrapMfa,
  bootstrapSignInExperience,
} from './bootstrap-sign-in.js';
import { bootstrapSeedUsers, loadSeedUsers } from './bootstrap-users.js';

/**
 * Entry point for environment-driven bootstrap logic, intended to run once immediately after the
 * standard Logto database seed.
 *
 * @param connection - Active database transaction connection supplied by the seed runner.
 */
export const runBootstrap = async (connection: DatabaseTransactionConnection): Promise<void> => {
  const adminConfig = getAdminConfig();
  const appConfig = getAppConfig();
  const m2mConfig = getM2mConfig();
  const smtpConfig = getSmtpConfig();
  const smtpSmsConfig = getSmtpSmsConfig();
  const seedUsers = await loadSeedUsers();
  const signInExpConfig = getSignInExperienceConfig();
  const mfaConfig = getMfaConfig();

  const hasConfig =
    [adminConfig, appConfig, m2mConfig, smtpConfig, smtpSmsConfig, mfaConfig].some(Boolean) ||
    signInExpConfig.bootstrapSignInExperience;

  if (!hasConfig) {
    return;
  }

  consoleLog.info('Running environment-based bootstrap...');

  await bootstrapAccountCenter(connection, Boolean(smtpSmsConfig));

  if (adminConfig) {
    await bootstrapAdminUser(connection, adminConfig);
  }

  if (appConfig) {
    await bootstrapApplication(connection, appConfig);
  }

  if (m2mConfig) {
    await bootstrapM2mApplication(connection, m2mConfig);
  }

  if (smtpConfig) {
    await bootstrapSmtpConnector(connection, smtpConfig);
  }

  if (smtpSmsConfig) {
    await bootstrapSmtpSmsConnector(connection, smtpSmsConfig);
  }

  if (signInExpConfig.bootstrapSignInExperience) {
    await bootstrapSignInExperience(
      connection,
      signInExpConfig.primaryIdentifier,
      signInExpConfig.signInMode
    );
  }

  if (mfaConfig) {
    await bootstrapMfa(connection, mfaConfig);
  }

  if (seedUsers.length > 0) {
    await bootstrapSeedUsers(connection, seedUsers);
  }

  consoleLog.succeed('Bootstrap complete');
};
