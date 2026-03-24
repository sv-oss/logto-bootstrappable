import { MfaFactor, SignInIdentifier, SignInMode } from '@logto/schemas';
import { getEnv, yes } from '@silverhand/essentials';

import { consoleLog } from '../../../utils.js';

/**
 * Configuration for the M2M application registered in the default tenant during bootstrap.
 * The application is automatically assigned the "Logto Management API access" role so it can
 * authenticate against the Management API using the client-credentials grant.
 */
export type M2mConfig = {
  /** Display name of the M2M application, read from `LOGTO_M2M_APP_NAME`. */
  name: string;
  /** OAuth 2.0 client ID, read from `LOGTO_M2M_CLIENT_ID`. */
  clientId: string;
  /** OAuth 2.0 client secret, read from `LOGTO_M2M_CLIENT_SECRET`. */
  clientSecret: string;
};

/** Credentials and identity for the initial admin user created during bootstrap. */
export type AdminConfig = {
  /** The admin account username, read from `LOGTO_ADMIN_USERNAME`. */
  username: string;
  /** The admin account password, read from `LOGTO_ADMIN_PASSWORD`. */
  password: string;
  /** Optional primary email for the admin account, read from `LOGTO_ADMIN_EMAIL`. */
  email?: string;
};

/** Configuration for the OIDC application registered in the default tenant during bootstrap. */
export type AppConfig = {
  /** Display name of the application, read from `LOGTO_APP_NAME`. */
  name: string;
  /** OAuth 2.0 client ID, read from `LOGTO_APP_CLIENT_ID`. */
  clientId: string;
  /** OAuth 2.0 client secret, read from `LOGTO_APP_CLIENT_SECRET`. */
  clientSecret: string;
  /** Comma-separated list of allowed redirect URIs, read from `LOGTO_APP_REDIRECT_URIS`. */
  redirectUris: string[];
  /** Comma-separated list of allowed post-logout redirect URIs, read from `LOGTO_APP_POST_LOGOUT_REDIRECT_URIS`. */
  postLogoutRedirectUris: string[];
};

/** Connection details and credentials for the SMTP email connector registered during bootstrap. */
export type SmtpConfig = {
  /** SMTP server hostname, read from `LOGTO_SMTP_HOST`. */
  host: string;
  /** SMTP server port, read from `LOGTO_SMTP_PORT`. */
  port: number;
  /** SMTP authentication credentials, read from `LOGTO_SMTP_USERNAME` and `LOGTO_SMTP_PASSWORD`. */
  auth: { user: string; pass: string };
  /** The "From" email address for outgoing messages, read from `LOGTO_SMTP_FROM_EMAIL`. */
  fromEmail: string;
  /** Optional reply-to address, read from `LOGTO_SMTP_REPLY_TO`. */
  replyTo?: string;
  /** Whether to use TLS/SSL for the connection, read from `LOGTO_SMTP_SECURE`. */
  secure: boolean;
  /** Whether to ignore TLS errors (e.g. self-signed certificates), read from `LOGTO_SMTP_IGNORE_SSL`. */
  ignoreTLS?: boolean;
  /** Whether to enable Nodemailer debug output (logs full SMTP traffic), read from `LOGTO_SMTP_DEBUG`. */
  debug?: boolean;
};

/** Connection details for the SMTP SMS connector registered during bootstrap. */
export type SmtpSmsConfig = {
  /** SMTP server hostname, read from `LOGTO_SMTP_SMS_HOST`. */
  host: string;
  /** SMTP server port, read from `LOGTO_SMTP_SMS_PORT`. */
  port: number;
  /** SMTP authentication credentials, read from `LOGTO_SMTP_SMS_USERNAME` and `LOGTO_SMTP_SMS_PASSWORD`. */
  auth: { user: string; pass: string };
  /** The "From" email address, read from `LOGTO_SMTP_SMS_FROM_EMAIL`. */
  fromEmail: string;
  /**
   * Template for the recipient gateway email address, read from `LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE`.
   * Use `{{phoneNumberOnly}}` for digits-only or `{{phone}}` for the raw E.164 number.
   * Example: `{{phoneNumberOnly}}@txt.att.net`
   */
  toEmailTemplate: string;
  /** Optional email subject line, read from `LOGTO_SMTP_SMS_SUBJECT`. */
  subject?: string;
  /** Whether to use TLS/SSL for the connection, read from `LOGTO_SMTP_SMS_SECURE`. */
  secure: boolean;
  /** Whether to ignore TLS errors (e.g. self-signed certificates), read from `LOGTO_SMTP_SMS_IGNORE_SSL`. */
  ignoreTLS?: boolean;
  /** Whether to enable Nodemailer debug output (logs full SMTP traffic), read from `LOGTO_SMTP_SMS_DEBUG`. */
  debug?: boolean;
};

export type SignInExperienceConfig = {
  /** The preferred primary sign-in identifier for the default tenant, read from `LOGTO_SIGN_IN_IDENTIFIER`. */
  primaryIdentifier: SignInIdentifier;
  /** If true, will automatically set up the Sign In Experience with dark mode enabled, and automatically collecting the user's name */
  bootstrapSignInExperience: boolean;
  /**
   * Overrides the sign-in mode for the default tenant, read from `LOGTO_SIGN_IN_MODE`.
   * Accepted values (case-insensitive): `SignIn`, `Register`, `SignInAndRegister`.
   * When unset the Logto default (`SignInAndRegister`) is preserved.
   */
  signInMode?: SignInMode;
};

/**
 * MFA factors to enable in the default tenant's sign-in experience, read from `LOGTO_MFA_FACTORS`.
 *
 * Accepted values (case-insensitive): `totp`, `webauthn`, `backupcode`,
 * `emailverificationcode`, `phoneverificationcode`.
 */
export type MfaConfig = {
  /** The MFA factors to enable, derived from the `LOGTO_MFA_FACTORS` comma-separated list. */
  factors: MfaFactor[];
};

/**
 * Reads admin user credentials from environment variables.
 *
 * @returns An {@link AdminConfig} when both `LOGTO_ADMIN_USERNAME` and `LOGTO_ADMIN_PASSWORD` are
 * set, otherwise `undefined`.
 */
export const getAdminConfig = (): AdminConfig | undefined => {
  const username = getEnv('LOGTO_ADMIN_USERNAME');
  const password = getEnv('LOGTO_ADMIN_PASSWORD');

  if (!username || !password) {
    return undefined;
  }

  return {
    username,
    password,
    email: getEnv('LOGTO_ADMIN_EMAIL') || undefined,
  };
};

/**
 * Reads OIDC application configuration from environment variables.
 *
 * @returns An {@link AppConfig} when `LOGTO_APP_CLIENT_ID`, `LOGTO_APP_CLIENT_SECRET`, and
 * `LOGTO_APP_REDIRECT_URIS` are all set, otherwise `undefined`.
 */
export const getAppConfig = (): AppConfig | undefined => {
  const clientId = getEnv('LOGTO_APP_CLIENT_ID');
  const clientSecret = getEnv('LOGTO_APP_CLIENT_SECRET');
  const redirectUrisRaw = getEnv('LOGTO_APP_REDIRECT_URIS');

  if (!clientId || !clientSecret || !redirectUrisRaw) {
    return undefined;
  }

  const postLogoutRedirectUrisRaw = getEnv('LOGTO_APP_POST_LOGOUT_REDIRECT_URIS');

  return {
    name: getEnv('LOGTO_APP_NAME') || 'My Application',
    clientId,
    clientSecret,
    redirectUris: redirectUrisRaw.split(',').map((uri) => uri.trim()),
    postLogoutRedirectUris: postLogoutRedirectUrisRaw
      ? postLogoutRedirectUrisRaw.split(',').map((uri) => uri.trim())
      : [],
  };
};

/**
 * Reads SMTP connector configuration from environment variables.
 *
 * @returns An {@link SmtpConfig} when `LOGTO_SMTP_HOST`, `LOGTO_SMTP_PORT`, `LOGTO_SMTP_USERNAME`,
 * `LOGTO_SMTP_PASSWORD`, and `LOGTO_SMTP_FROM_EMAIL` are all set, otherwise `undefined`.
 */
export const getSmtpConfig = (): SmtpConfig | undefined => {
  const host = getEnv('LOGTO_SMTP_HOST');
  const portRaw = getEnv('LOGTO_SMTP_PORT');
  const username = getEnv('LOGTO_SMTP_USERNAME');
  const password = getEnv('LOGTO_SMTP_PASSWORD');
  const fromEmail = getEnv('LOGTO_SMTP_FROM_EMAIL');

  if (!host || !portRaw || !username || !password || !fromEmail) {
    return undefined;
  }

  return {
    host,
    port: Number(portRaw),
    auth: { user: username, pass: password },
    fromEmail,
    replyTo: getEnv('LOGTO_SMTP_REPLY_TO') || undefined,
    secure: yes(getEnv('LOGTO_SMTP_SECURE')),
    ignoreTLS: yes(getEnv('LOGTO_SMTP_IGNORE_SSL')) || undefined,
    debug: yes(getEnv('LOGTO_SMTP_DEBUG')) || undefined,
  };
};

/**
 * Reads SMTP SMS connector configuration from environment variables.
 *
 * @returns An {@link SmtpSmsConfig} when `LOGTO_SMTP_SMS_HOST`, `LOGTO_SMTP_SMS_PORT`,
 * `LOGTO_SMTP_SMS_USERNAME`, `LOGTO_SMTP_SMS_PASSWORD`, `LOGTO_SMTP_SMS_FROM_EMAIL`, and
 * `LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE` are all set, otherwise `undefined`.
 */
export const getSmtpSmsConfig = (): SmtpSmsConfig | undefined => {
  const host = getEnv('LOGTO_SMTP_SMS_HOST');
  const portRaw = getEnv('LOGTO_SMTP_SMS_PORT');
  const username = getEnv('LOGTO_SMTP_SMS_USERNAME');
  const password = getEnv('LOGTO_SMTP_SMS_PASSWORD');
  const fromEmail = getEnv('LOGTO_SMTP_SMS_FROM_EMAIL');
  const toEmailTemplate = getEnv('LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE');

  if (!host || !portRaw || !username || !password || !fromEmail || !toEmailTemplate) {
    return undefined;
  }

  return {
    host,
    port: Number(portRaw),
    auth: { user: username, pass: password },
    fromEmail,
    toEmailTemplate,
    subject: getEnv('LOGTO_SMTP_SMS_SUBJECT') || undefined,
    secure: yes(getEnv('LOGTO_SMTP_SMS_SECURE')),
    ignoreTLS: yes(getEnv('LOGTO_SMTP_SMS_IGNORE_SSL')) || undefined,
    debug: yes(getEnv('LOGTO_SMTP_SMS_DEBUG')) || undefined,
  };
};

/** Maps lower-cased user-supplied tokens to their canonical {@link SignInMode} enum values. */
const signInModeAliases: Record<string, SignInMode> = {
  signin: SignInMode.SignIn,
  register: SignInMode.Register,
  signinandregister: SignInMode.SignInAndRegister,
};

/**
 * Reads the sign-in identifier preference from `LOGTO_SIGN_IN_IDENTIFIER`, as well as
 * if it should bootstrap the sign in experience from `LOGTO_BOOTSTRAP_SIGNIN_EXPERIENCE`.
 * Optionally overrides the sign-in mode from `LOGTO_SIGN_IN_MODE`.
 *
 * @default If env vars are not set, Username will be the default sign in identifier, and the experience will not be bootstrapped
 */
export const getSignInExperienceConfig = (): SignInExperienceConfig => {
  const primarySignInId = getEnv('LOGTO_SIGN_IN_IDENTIFIER').toLowerCase();
  const bootstrapSignInExperience =
    getEnv('LOGTO_BOOTSTRAP_SIGNIN_EXPERIENCE').toLowerCase() === 'true';

  const signInModeRaw = getEnv('LOGTO_SIGN_IN_MODE')
    .toLowerCase()
    .replaceAll('_', '')
    .replaceAll('-', '');
  const signInMode = signInModeAliases[signInModeRaw];

  return {
    primaryIdentifier:
      primarySignInId === 'email' ? SignInIdentifier.Email : SignInIdentifier.Username,
    bootstrapSignInExperience,
    signInMode,
  };
};

/** Maps lower-cased user-supplied factor tokens to their canonical {@link MfaFactor} enum values. */
const mfaFactorAliases: Record<string, MfaFactor> = {
  totp: MfaFactor.TOTP,
  webauthn: MfaFactor.WebAuthn,
  backupcode: MfaFactor.BackupCode,
  emailverificationcode: MfaFactor.EmailVerificationCode,
  phoneverificationcode: MfaFactor.PhoneVerificationCode,
};

/**
 * Reads the MFA factors to enable from the `LOGTO_MFA_FACTORS` environment variable.
 *
 * The variable accepts a comma-separated list of factor names (case-insensitive):
 * `totp`, `webauthn`, `backupCode`, `emailVerificationCode`, `phoneVerificationCode`.
 *
 * Unrecognised tokens are silently ignored.
 *
 * @returns An {@link MfaConfig} when `LOGTO_MFA_FACTORS` is non-empty, otherwise `undefined`.
 */
export const getMfaConfig = (): MfaConfig | undefined => {
  const raw = getEnv('LOGTO_MFA_FACTORS');

  if (!raw) {
    consoleLog.info('No MFA Factors found, Skipping MFA setup');
    return undefined;
  }

  const factors = raw
    .split(',')
    .map((token) => mfaFactorAliases[token.trim().toLowerCase()])
    .filter((factor): factor is MfaFactor => factor !== undefined);

  if (factors.length === 0) {
    consoleLog.info('No valid MFA Factors found, Skipping MFA setup');
    return undefined;
  }

  return { factors };
};

/**
 * Reads M2M application configuration from environment variables.
 *
 * @returns An {@link M2mConfig} when both `LOGTO_M2M_CLIENT_ID` and `LOGTO_M2M_CLIENT_SECRET` are
 * set, otherwise `undefined`.
 */
export const getM2mConfig = (): M2mConfig | undefined => {
  const clientId = getEnv('LOGTO_M2M_CLIENT_ID');
  const clientSecret = getEnv('LOGTO_M2M_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return {
    name: getEnv('LOGTO_M2M_APP_NAME') || 'Management API Client',
    clientId,
    clientSecret,
  };
};
