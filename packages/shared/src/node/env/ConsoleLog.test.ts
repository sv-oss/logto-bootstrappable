import { noop } from '@silverhand/essentials';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ConsoleLog from './ConsoleLog.js';

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
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env.LOG_FORMAT;
  });

  const parseLog = (spy: ReturnType<typeof vi.spyOn>, callIndex = 0) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    JSON.parse(String((spy.mock.calls[callIndex] ?? [])[0]));

  it('emits a JSON object with level "plain" for plain()', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(noop);
    new ConsoleLog().plain('hello', 'world');

    const entry = parseLog(logSpy);
    expect(entry).toMatchObject({ level: 'plain', message: 'hello world' });
    expect(typeof entry.time).toBe('string');
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

    expect(parseLog(logSpy)).toMatchObject({ level: 'info', prefix: 'myservice', message: 'ready' });
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
    const err = new Error('oops');
    new ConsoleLog().error('caught', err);

    const entry = parseLog(errorSpy);
    expect(entry).toMatchObject({ level: 'error' });
    expect(entry.error).toMatchObject({ name: 'Error', message: 'oops' });
    expect(typeof entry.error.stack).toBe('string');
  });
});
