import { noop } from '@silverhand/essentials';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ConsoleLog from './ConsoleLog.js';

describe('ConsoleLog audit()', () => {
  const auditPayload: Record<string, unknown> = {
    key: 'Interaction.SignIn.Submit',
    result: 'Success',
    userId: 'usr_abc123',
    applicationId: 'app_xyz',
    ip: '10.0.0.1',
  };

  describe('JSON mode', () => {
    beforeEach(() => {
      process.env.LOG_FORMAT = 'json';
    });

    afterEach(() => {
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_FORMAT;
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_AUDIT;
    });

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const parseAuditLog = (spy: ReturnType<typeof vi.spyOn>) =>
      JSON.parse(String((spy.mock.calls[0] ?? [])[0]));

    it('emits level "audit" with key and payload fields as top-level keys', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.SignIn.Submit', auditPayload);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entry = parseAuditLog(logSpy);
      expect(entry).toMatchObject({
        level: 'audit',
        key: 'Interaction.SignIn.Submit',
        result: 'Success',
        userId: 'usr_abc123',
        applicationId: 'app_xyz',
        ip: '10.0.0.1',
      });
      expect(typeof entry.time).toBe('string');
    });

    it('includes the prefix field when set', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog('req-id').audit('Interaction.SignIn.Submit', auditPayload);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entry = parseAuditLog(logSpy);
      expect(entry).toMatchObject({ prefix: 'req-id', level: 'audit' });
    });

    it('suppresses all audit logs when LOG_AUDIT=off', () => {
      process.env.LOG_AUDIT = 'off';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.SignIn.Submit', auditPayload);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses when LOG_AUDIT=silent', () => {
      process.env.LOG_AUDIT = 'silent';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.SignIn.Submit', auditPayload);

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('text mode', () => {
    afterEach(() => {
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_AUDIT;
    });

    it('emits a [audit] prefix line with key, result, userId, and app', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.SignIn.Submit', auditPayload);

      const output = (logSpy.mock.calls[0] ?? []).map(String).join(' ');
      expect(output).toContain('[audit] Interaction.SignIn.Submit');
      expect(output).toContain('result=Success');
      expect(output).toContain('userId=usr_abc123');
      expect(output).toContain('app=app_xyz');
    });

    it('omits userId and app when not present in payload', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.Create', {
        key: 'Interaction.Create',
        result: 'Success',
      });

      const output = (logSpy.mock.calls[0] ?? []).map(String).join(' ');
      expect(output).toContain('[audit]');
      expect(output).not.toContain('userId=');
      expect(output).not.toContain('app=');
    });

    it('suppresses output when LOG_AUDIT=off', () => {
      process.env.LOG_AUDIT = 'off';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().audit('Interaction.SignIn.Submit', auditPayload);

      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
