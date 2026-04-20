import { afterEach, describe, expect, it } from 'vitest';

import { buildDatabaseUrl, parseTimeoutEnv } from './GlobalValues.js';

const databaseEnvKeys = [
  'DB_URL',
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'DB_SSL_MODE',
] as const;

const clearDatabaseEnv = () => {
  for (const key of databaseEnvKeys) {
    // eslint-disable-next-line @silverhand/fp/no-delete, @typescript-eslint/no-dynamic-delete
    delete process.env[key];
  }
};

describe('buildDatabaseUrl', () => {
  afterEach(clearDatabaseEnv);

  it('returns DB_URL directly when set', () => {
    process.env.DB_URL = 'postgres://user:pass@host:5432/db';
    expect(buildDatabaseUrl()).toBe('postgres://user:pass@host:5432/db');
  });

  it('prefers DB_URL over individual fields', () => {
    process.env.DB_URL = 'postgres://direct@host/db';
    process.env.DB_HOST = 'other-host';
    process.env.DB_USERNAME = 'u';
    process.env.DB_PASSWORD = 'p';
    process.env.DB_NAME = 'n';
    expect(buildDatabaseUrl()).toBe('postgres://direct@host/db');
  });

  it('constructs URL from individual fields with default port', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    expect(buildDatabaseUrl()).toBe('postgresql://admin:secret@rds.example.com:5432/logto');
  });

  it('constructs URL from individual fields with explicit port', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    process.env.DB_PORT = '5433';
    expect(buildDatabaseUrl()).toBe('postgresql://admin:secret@rds.example.com:5433/logto');
  });

  it('URL-encodes special characters in username and password', () => {
    process.env.DB_HOST = 'host';
    process.env.DB_USERNAME = 'user@name';
    process.env.DB_PASSWORD = 'p@ss:w0rd/!';
    process.env.DB_NAME = 'db';
    const url = buildDatabaseUrl();
    expect(url).toBe(
      `postgresql://${encodeURIComponent('user@name')}:${encodeURIComponent('p@ss:w0rd/!')}@host:5432/db`
    );
  });

  it('throws when neither DB_URL nor all required fields are set', () => {
    expect(() => buildDatabaseUrl()).toThrow();
  });

  it('throws when individual fields are incomplete (missing DB_HOST)', () => {
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    expect(() => buildDatabaseUrl()).toThrow();
  });

  it('throws when individual fields are incomplete (missing DB_PASSWORD)', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_NAME = 'logto';
    expect(() => buildDatabaseUrl()).toThrow();
  });

  it('appends sslmode query param when DB_SSL_MODE is set', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    process.env.DB_SSL_MODE = 'require';
    expect(buildDatabaseUrl()).toBe(
      'postgresql://admin:secret@rds.example.com:5432/logto?sslmode=require'
    );
  });

  it('supports no-verify sslmode', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    process.env.DB_SSL_MODE = 'no-verify';
    expect(buildDatabaseUrl()).toBe(
      'postgresql://admin:secret@rds.example.com:5432/logto?sslmode=no-verify'
    );
  });

  it('omits sslmode when DB_SSL_MODE is not set', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    expect(buildDatabaseUrl()).not.toContain('sslmode');
  });

  it('throws on an invalid DB_SSL_MODE value', () => {
    process.env.DB_HOST = 'rds.example.com';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'logto';
    process.env.DB_SSL_MODE = 'bogus';
    expect(() => buildDatabaseUrl()).toThrow(/Invalid DB_SSL_MODE/);
  });
});

describe('parseTimeoutEnv', () => {
  it('returns undefined for missing, blank, or invalid values', () => {
    expect(parseTimeoutEnv()).toBeUndefined();
    expect(parseTimeoutEnv('')).toBeUndefined();
    expect(parseTimeoutEnv('   ')).toBeUndefined();
    expect(parseTimeoutEnv('abc')).toBeUndefined();
    expect(parseTimeoutEnv('123abc')).toBeUndefined();
  });

  it('returns DISABLE_TIMEOUT for the sentinel value', () => {
    expect(parseTimeoutEnv('DISABLE_TIMEOUT')).toBe('DISABLE_TIMEOUT');
    expect(parseTimeoutEnv(' DISABLE_TIMEOUT ')).toBe('DISABLE_TIMEOUT');
  });

  it('parses numeric timeout values', () => {
    expect(parseTimeoutEnv('5000')).toBe(5000);
    expect(parseTimeoutEnv(' 15 ')).toBe(15);
    expect(parseTimeoutEnv('0')).toBe(0);
  });

  it('accepts negative and decimal values as numbers', () => {
    expect(parseTimeoutEnv('-1')).toBe(-1);
    expect(parseTimeoutEnv('1.5')).toBe(1.5);
  });
});
