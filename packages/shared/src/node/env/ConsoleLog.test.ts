import { noop } from '@silverhand/essentials';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ConsoleLog, { type HttpLogEntry } from './ConsoleLog.js';

describe('ConsoleLog', () => {
  it('logs the plain message as is', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().plain('message', 1, undefined, null);

    expect(logSpy).toHaveBeenCalledWith('message', 1, undefined, null);
  });

  it('logs the info message with an info prefix', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().info('message', 1, null);

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/info/), 'message', 1, null);
  });

  it('logs the success message with an info and checkmark prefix', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().succeed('message', 1, undefined, null);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/info/),
      expect.stringMatching(/✔/),
      'message',
      1,
      undefined,
      null
    );
  });

  it('logs the warn message with a warn prefix', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    new ConsoleLog().warn('message', { a: 1 });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/warn/), 'message', { a: 1 });
  });

  it('logs the error message with a error prefix', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    new ConsoleLog().error('message', { a: 1 });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/error/), 'message', {
      a: 1,
    });
  });

  it('logs the fatal message with a fatal prefix and exits the process', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    // @ts-expect-error process exit is mocked
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(noop);
    new ConsoleLog().fatal('message', { a: 1 });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/fatal/), 'message', { a: 1 });
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('logs the message with a custom prefix', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('custom').plain('message', 1, null);

    expect(logSpy).toHaveBeenCalledWith('custom  ', 'message', 1, null);
  });

  it('logs the message with a custom prefix and an info prefix', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('custom').info('message', 1, null);

    expect(logSpy).toHaveBeenCalledWith(
      'custom  ',
      expect.stringMatching(/info/),
      'message',
      1,
      null
    );
  });

  it('logs the message with a custom prefix and padding', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('custom', 10).plain('message', 1, null);

    expect(logSpy).toHaveBeenCalledWith('custom    ', 'message', 1, null);
  });
});

describe('ConsoleLog (JSON mode)', () => {
  beforeEach(() => {
    process.env.LOG_FORMAT = 'json';
  });

  afterEach(() => {
    // eslint-disable-next-line @silverhand/fp/no-delete
    delete process.env.LOG_FORMAT;
  });

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const parseLog = (spy: ReturnType<typeof vi.spyOn>, callIndex = 0) =>
    JSON.parse(String((spy.mock.calls[callIndex] ?? [])[0]));

  it('emits a JSON object with level "plain" for plain()', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().plain('hello', 'world');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entry = parseLog(logSpy);
    expect(entry).toMatchObject({ level: 'plain', message: 'hello world' });
    expect(typeof entry.time).toBe('number');
  });

  it('emits a JSON object with level "info" for info()', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().info('started');

    expect(parseLog(logSpy)).toMatchObject({ level: 'info', message: 'started' });
  });

  it('emits a JSON object with level "info" for succeed()', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().succeed('done');

    expect(parseLog(logSpy)).toMatchObject({ level: 'info', message: 'done' });
  });

  it('emits a JSON object with level "warn" for warn()', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    new ConsoleLog().warn('watch out');

    expect(parseLog(warnSpy)).toMatchObject({ level: 'warn', message: 'watch out' });
  });

  it('emits a JSON object with level "error" for error()', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    new ConsoleLog().error('something broke');

    expect(parseLog(errorSpy)).toMatchObject({ level: 'error', message: 'something broke' });
  });

  it('emits a JSON object with level "fatal" for fatal() and exits the process', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    // @ts-expect-error process exit is mocked
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(noop);
    new ConsoleLog().fatal('critical failure');

    expect(parseLog(errorSpy)).toMatchObject({ level: 'fatal', message: 'critical failure' });
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('includes the prefix field when a prefix is set', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('myservice').info('ready');

    expect(parseLog(logSpy)).toMatchObject({
      level: 'info',
      prefix: 'myservice',
      message: 'ready',
    });
  });

  it('strips ANSI escape codes from the message', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    // Simulate a coloured string (e.g. from koa-logger or chalk)
    new ConsoleLog().plain('\u001B[32mgreen text\u001B[0m');

    expect(parseLog(logSpy)).toMatchObject({ message: 'green text' });
  });

  it('serialises objects inline in the message', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().info('data:', { key: 'value' });

    expect(parseLog(logSpy)).toMatchObject({ message: 'data: {"key":"value"}' });
  });

  it('includes an error field with name, message, and stack for Error arguments', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
    const error = new Error('oops');
    new ConsoleLog().error('caught', error);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entry = parseLog(errorSpy);
    expect(entry).toMatchObject({ level: 'error' });
    expect(entry.error).toMatchObject({ name: 'Error', message: 'oops' });
    expect(typeof entry.error.stack).toBe('string');
  });

  it('emits context fields as top-level JSON keys via withContext()', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().withContext({ ip: '1.2.3.4', svc: 'auth' }).plain('request');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entry = parseLog(logSpy);
    expect(entry).toMatchObject({ level: 'plain', message: 'request', ip: '1.2.3.4', svc: 'auth' });
  });

  it('omits context entries with undefined values', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().withContext({ ip: '1.2.3.4', fwd: undefined }).plain('request');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entry = parseLog(logSpy);
    expect(entry.ip).toBe('1.2.3.4');
    expect(Object.keys(entry as object)).not.toContain('fwd');
  });

  it('merges context from chained withContext() calls', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().withContext({ ip: '1.2.3.4' }).withContext({ svc: 'auth' }).plain('request');

    expect(parseLog(logSpy)).toMatchObject({ ip: '1.2.3.4', svc: 'auth' });
  });

  it('preserves prefix alongside context fields', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('svc').withContext({ ip: '10.0.0.1' }).info('ready');

    expect(parseLog(logSpy)).toMatchObject({ prefix: 'svc', ip: '10.0.0.1', message: 'ready' });
  });
});

describe('ConsoleLog (text mode, withContext)', () => {
  it('appends context as key=value pairs after the message', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().withContext({ ip: '1.2.3.4', svc: 'auth' }).plain('request');

    const args = logSpy.mock.calls[0] ?? [];
    const lastArg = String(args.at(-1));
    expect(lastArg).toContain('ip=1.2.3.4');
    expect(lastArg).toContain('svc=auth');
  });

  it('does not append context suffix when no context is set', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().plain('message', 1, null);

    expect(logSpy).toHaveBeenCalledWith('message', 1, null);
  });

  it('appends context suffix alongside a prefix', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog('svc').withContext({ ip: '10.0.0.1' }).plain('request');

    const args = logSpy.mock.calls[0] ?? [];
    expect(String(args[0])).toContain('svc');
    expect(String(args.at(-1))).toContain('ip=10.0.0.1');
  });
});

describe('ConsoleLog http()', () => {
  const requestEntry: HttpLogEntry = {
    method: 'GET',
    url: '/api/path',
    ip: '1.2.3.4',
    forwardedProto: 'https',
    userAgent: 'TestAgent/1.0',
    host: 'example.com',
    amznTraceId: 'Root=1-abc',
    requestLength: 512,
  };

  const responseEntry: HttpLogEntry = {
    ...requestEntry,
    statusCode: 200,
    durationMs: 42,
    responseLength: 1024,
  };

  describe('JSON mode', () => {
    beforeEach(() => {
      process.env.LOG_FORMAT = 'json';
    });

    afterEach(() => {
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_FORMAT;
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_HTTP;
    });

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const parseHttpLog = (spy: ReturnType<typeof vi.spyOn>, callIndex = 0) =>
      JSON.parse(String((spy.mock.calls[callIndex] ?? [])[0]));

    it('emits level "http" with full header field names', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  <-- GET /api/path', requestEntry);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entry = parseHttpLog(logSpy);
      expect(entry).toMatchObject({
        level: 'http',
        method: 'GET',
        url: '/api/path',
        ip: '1.2.3.4',
        'x-forwarded-proto': 'https',
        'user-agent': 'TestAgent/1.0',
        host: 'example.com',
        'x-amzn-trace-id': 'Root=1-abc',
        request_length: 512,
      });
      expect(typeof entry.time).toBe('number');
    });

    it('includes numeric status_code, duration_ms, response_length on response entries', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  --> GET /api/path 200 42ms 1.0kb', responseEntry);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entry = parseHttpLog(logSpy);
      expect(entry.duration_ms).toBe(42);
      expect(entry.response_length).toBe(1024);
    });

    it('includes the prefix field when set', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog('req-id').http('  <-- GET /api/path', requestEntry);

      expect(parseHttpLog(logSpy)).toMatchObject({ prefix: 'req-id' });
    });

    it('suppresses all http logs when LOG_HTTP=off', () => {
      process.env.LOG_HTTP = 'off';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  --> GET /api/path 200 42ms -', responseEntry);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses request lines when LOG_HTTP=error', () => {
      process.env.LOG_HTTP = 'error';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  <-- GET /api/path', requestEntry);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses successful responses when LOG_HTTP=error', () => {
      process.env.LOG_HTTP = 'error';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  --> GET /api/path 200 42ms -', responseEntry);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('emits error responses when LOG_HTTP=error', () => {
      process.env.LOG_HTTP = 'error';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      const errorEntry: HttpLogEntry = { ...responseEntry, statusCode: 500 };
      new ConsoleLog().http('  --> GET /api/path 500 12ms -', errorEntry);

      expect(parseHttpLog(logSpy)).toMatchObject({ level: 'http', status_code: 500 });
    });
  });

  describe('text mode', () => {
    afterEach(() => {
      // eslint-disable-next-line @silverhand/fp/no-delete
      delete process.env.LOG_HTTP;
    });

    it('appends ip, proto, ua, host, trace extras to the koa string', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  <-- GET /api/path', requestEntry);

      const args = logSpy.mock.calls[0] ?? [];
      const output = args.map(String).join(' ');
      expect(output).toContain('ip=1.2.3.4');
      expect(output).toContain('proto=https');
      expect(output).toContain('ua=TestAgent/1.0');
      expect(output).toContain('host=example.com');
      expect(output).toContain('trace=Root=1-abc');
    });

    it('appends req_len on request lines but not response lines', () => {
      const requestSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  <-- GET /api/path', requestEntry);
      const requestOutput = (requestSpy.mock.calls[0] ?? []).map(String).join(' ');
      expect(requestOutput).toContain('req_len=512');

      requestSpy.mockClear();

      new ConsoleLog().http('  --> GET /api/path 200 42ms 1.0kb', responseEntry);
      const respOutput = (requestSpy.mock.calls[0] ?? []).map(String).join(' ');
      expect(respOutput).not.toContain('req_len=');
    });

    it('suppresses output when LOG_HTTP=off', () => {
      process.env.LOG_HTTP = 'off';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
      new ConsoleLog().http('  --> GET /api/path 200 42ms -', responseEntry);

      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});

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
      expect(typeof entry.time).toBe('number');
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
