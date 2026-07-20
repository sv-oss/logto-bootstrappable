import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSmtpConfig, getSmtpSmsConfig } from './bootstrap-config.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('SMTP bootstrap configuration', () => {
  it('supports a source-authorized email relay without credentials', () => {
    vi.stubEnv('LOGTO_SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('LOGTO_SMTP_PORT', '25');
    vi.stubEnv('LOGTO_SMTP_FROM_EMAIL', 'logto@example.com');

    expect(getSmtpConfig()).toMatchObject({
      host: 'smtp.example.com',
      port: 25,
      fromEmail: 'logto@example.com',
      secure: false,
    });
    expect(getSmtpConfig()).not.toHaveProperty('auth');
  });

  it('includes email relay credentials when both values are set', () => {
    vi.stubEnv('LOGTO_SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('LOGTO_SMTP_PORT', '587');
    vi.stubEnv('LOGTO_SMTP_FROM_EMAIL', 'logto@example.com');
    vi.stubEnv('LOGTO_SMTP_USERNAME', 'user');
    vi.stubEnv('LOGTO_SMTP_PASSWORD', 'password');

    expect(getSmtpConfig()).toHaveProperty('auth', { user: 'user', pass: 'password' });
  });

  it('rejects partial email relay credentials', () => {
    vi.stubEnv('LOGTO_SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('LOGTO_SMTP_PORT', '587');
    vi.stubEnv('LOGTO_SMTP_FROM_EMAIL', 'logto@example.com');
    vi.stubEnv('LOGTO_SMTP_USERNAME', 'user');

    expect(() => getSmtpConfig()).toThrow(
      'LOGTO_SMTP_USERNAME and LOGTO_SMTP_PASSWORD must either both be set or both be unset.'
    );
  });

  it('supports a source-authorized SMS relay without credentials', () => {
    vi.stubEnv('LOGTO_SMTP_SMS_HOST', 'smtp.example.com');
    vi.stubEnv('LOGTO_SMTP_SMS_PORT', '25');
    vi.stubEnv('LOGTO_SMTP_SMS_FROM_EMAIL', 'logto@example.com');
    vi.stubEnv('LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE', '{{phoneNumberOnly}}@sms.example.com');

    expect(getSmtpSmsConfig()).toMatchObject({
      host: 'smtp.example.com',
      port: 25,
      fromEmail: 'logto@example.com',
      toEmailTemplate: '{{phoneNumberOnly}}@sms.example.com',
      secure: false,
    });
    expect(getSmtpSmsConfig()).not.toHaveProperty('auth');
  });

  it('rejects partial SMS relay credentials', () => {
    vi.stubEnv('LOGTO_SMTP_SMS_HOST', 'smtp.example.com');
    vi.stubEnv('LOGTO_SMTP_SMS_PORT', '25');
    vi.stubEnv('LOGTO_SMTP_SMS_FROM_EMAIL', 'logto@example.com');
    vi.stubEnv('LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE', '{{phoneNumberOnly}}@sms.example.com');
    vi.stubEnv('LOGTO_SMTP_SMS_PASSWORD', 'password');

    expect(() => getSmtpSmsConfig()).toThrow(
      'LOGTO_SMTP_SMS_USERNAME and LOGTO_SMTP_SMS_PASSWORD must either both be set or both be unset.'
    );
  });
});
