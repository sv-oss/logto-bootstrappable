import chalk from 'chalk';

type LogLevel = 'plain' | 'info' | 'warn' | 'error' | 'fatal';

/** Strips ANSI escape codes from a string so JSON output is clean. */
const stripAnsi = (value: string) =>
  // eslint-disable-next-line no-control-regex
  value.replace(/\u001B\[(?:\d+;)*\d+m/g, '');

export default class ConsoleLog {
  /**
   * When `true`, all log methods emit a single-line JSON object instead of coloured text.
   * Controlled by the `LOG_FORMAT` environment variable — set it to `json` to enable.
   *
   * Implemented as a getter so that tests can override `process.env.LOG_FORMAT` at runtime.
   */
  static get jsonOutput(): boolean {
    return process.env.LOG_FORMAT === 'json';
  }

  static prefixes = Object.freeze({
    info: chalk.bold(chalk.blue('info')),
    warn: chalk.bold(chalk.yellow('warn')),
    error: chalk.bold(chalk.red('error')),
    fatal: chalk.bold(chalk.red('fatal')),
  });

  constructor(
    /** A prefix to prepend to all log messages. */
    public readonly prefix?: string,
    /**
     * The number of spaces to pad the prefix. For example, if the prefix is `custom` and the
     * padding is 8, the output will be `custom  `.
     *
     * @default 8
     */
    public readonly padding = 8
  ) {}

  plain: typeof console.log = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.log(this.formatJson('plain', args));
      return;
    }

    console.log(...this.getArgs(args));
  };

  info: typeof console.log = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.log(this.formatJson('info', args));
      return;
    }

    this.plain(ConsoleLog.prefixes.info, ...args);
  };

  succeed: typeof console.log = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.log(this.formatJson('info', args));
      return;
    }

    this.info(chalk.green('✔'), ...args);
  };

  warn: typeof console.log = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.warn(this.formatJson('warn', args));
      return;
    }

    console.warn(...this.getArgs([ConsoleLog.prefixes.warn, ...args]));
  };

  error: typeof console.log = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.error(this.formatJson('error', args));
      return;
    }

    console.error(...this.getArgs([ConsoleLog.prefixes.error, ...args]));
  };

  fatal: (...args: Parameters<typeof console.log>) => never = (...args) => {
    if (ConsoleLog.jsonOutput) {
      console.error(this.formatJson('fatal', args));
    } else {
      console.error(...this.getArgs([ConsoleLog.prefixes.fatal, ...args]));
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  };

  protected getArgs(args: Parameters<typeof console.log>) {
    if (this.prefix) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return [this.prefix.padEnd(this.padding), ...args];
    }

    return args;
  }

  /**
   * Serialises a log call into a single-line JSON string.
   *
   * Each argument is converted to a plain string (ANSI codes stripped, objects JSON-encoded,
   * Error instances expanded to `name: message`). The results are joined with a space into the
   * `message` field. When an `Error` is present its `stack` is included separately under `error`.
   */
  private formatJson(level: LogLevel, args: Parameters<typeof console.log>): string {
    const entry: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      message: args.map((arg) => this.serializeArg(arg)).join(' '),
    };

    if (this.prefix) {
      entry['prefix'] = stripAnsi(this.prefix);
    }

    const firstError = args.find((arg): arg is Error => arg instanceof Error);

    if (firstError) {
      entry['error'] = { name: firstError.name, message: firstError.message, stack: firstError.stack };
    }

    return JSON.stringify(entry);
  }

  private serializeArg(arg: unknown): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    if (typeof arg === 'object') return JSON.stringify(arg);

    return stripAnsi(String(arg));
  }
}
