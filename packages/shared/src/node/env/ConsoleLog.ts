import chalk from 'chalk';

type LogLevel = 'plain' | 'info' | 'warn' | 'error' | 'fatal';

/** Structured fields for a single HTTP request or response log entry. */
export type HttpLogEntry = {
  /** HTTP method (e.g. `GET`, `POST`). */
  method: string;
  /** Request URL (may include query string). */
  url: string;
  /** URL pathname without query string. */
  path?: string;
  /** Resolved client IP address. */
  ip?: string;
  /** Raw `X-Forwarded-For` chain — only present when it differs from the resolved IP. */
  forwardedFor?: string;
  /** `X-Forwarded-Proto` value (e.g. `https`). */
  forwardedProto?: string;
  /** Raw `User-Agent` header value. */
  userAgent?: string;
  /** `Host` header value. */
  host?: string;
  /** `X-Amzn-Trace-Id` header value (AWS ALB trace ID). */
  amznTraceId?: string;
  /** Raw `Accept` header value. */
  accepts?: string;
  /** `Origin` header value. */
  origin?: string;
  /** Filtered request headers (sensitive and already-captured headers excluded). */
  requestHeaders?: Record<string, string>;
  /** Request `Content-Length` in bytes. */
  requestLength?: number;
  /** HTTP response status code — present on response lines only. */
  statusCode?: number;
  /** Request duration in milliseconds — present on response lines only. */
  durationMs?: number;
  /** Response body length in bytes — present on response lines only. */
  responseLength?: number;
  /** Response `Content-Type` header — present on response lines only. */
  responseContentType?: string;
};

/** Strips ANSI escape codes from a string so JSON output is clean. */
const stripAnsi = (value: string) =>
  // eslint-disable-next-line no-control-regex
  value.replaceAll(/\u001B\[(?:\d+;)*\d+m/g, '');

const filterContext = (context: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(context).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );

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

  /**
   * Controls whether audit log entries are emitted to the console.
   *
   * - Unset or any other value → emit all audit log entries.
   * - `off` / `silent` / `false` → suppress all audit log entries.
   *
   * Implemented as a getter so that tests can override `process.env.LOG_AUDIT` at runtime.
   */
  static get auditLogLevel(): 'all' | 'off' {
    const value = process.env.LOG_AUDIT?.toLowerCase();

    if (value === 'off' || value === 'silent' || value === 'false') {
      return 'off';
    }

    return 'all';
  }

  /**
   * Controls which HTTP request/response log entries are emitted.
   *
   * - Unset or any other value → log all requests and responses.
   * - `error` → only log responses with status ≥ 400 (request lines are suppressed too).
   * - `off` / `silent` / `false` → suppress all HTTP log entries.
   *
   * Implemented as a getter so that tests can override `process.env.LOG_HTTP` at runtime.
   */
  static get httpLogLevel(): 'all' | 'error' | 'off' {
    const value = process.env.LOG_HTTP?.toLowerCase();

    if (value === 'off' || value === 'silent' || value === 'false') {
      return 'off';
    }

    if (value === 'error') {
      return 'error';
    }

    return 'all';
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
    public readonly padding = 8,
    /**
     * Optional key-value pairs that are merged into every log entry.
     * In JSON mode they appear as top-level fields alongside `level`, `time`, and `message`.
     * In text mode they are appended as `key=value` pairs at the end of each line.
     */
    private readonly context?: Record<string, string>
  ) {}

  /**
   * Returns a new `ConsoleLog` instance that inherits the current prefix and padding but
   * also carries the given context. Entries with `undefined` values are omitted.
   *
   * In JSON mode the context keys appear as top-level fields in the output object.
   * In text mode they are appended as `key=value` pairs at the end of the line.
   */
  withContext(context: Record<string, string | undefined>): ConsoleLog {
    return new ConsoleLog(this.prefix, this.padding, {
      ...this.context,
      ...filterContext(context),
    });
  }

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

  /**
   * Logs a single HTTP request or response entry.
   *
   * In **JSON mode** all fields from `entry` are emitted as top-level keys (using standard HTTP
   * header names where applicable) under `level: "http"`.
   *
   * In **text mode** the `koaString` produced by koa-logger is used as the base line, and any
   * extra fields not already present in that string are appended as chalk-grayed `key=value` pairs.
   *
   * Visibility is controlled by `ConsoleLog.httpLogLevel` (`LOG_HTTP` env var).
   */
  http(koaString: string, entry: HttpLogEntry): void {
    const level = ConsoleLog.httpLogLevel;

    if (level === 'off') {
      return;
    }

    // In "error" mode, suppress request lines (no statusCode) and successful responses.
    if (level === 'error' && (entry.statusCode === undefined || entry.statusCode < 400)) {
      return;
    }

    if (ConsoleLog.jsonOutput) {
      console.log(this.formatHttpJson(entry));
      return;
    }

    const extras = this.formatHttpTextExtras(entry);
    console.log(...this.getArgs(extras ? [`${koaString} ${extras}`] : [koaString]));
  }

  /**
   * Logs an audit event recorded by `koa-audit-log`.
   *
   * In **JSON mode** all fields from `payload` are emitted as top-level keys under
   * `level: "audit"`, making it easy to route these lines to a dedicated log group (e.g. CloudWatch).
   *
   * In **text mode** a compact `[audit] key result=… userId=…` line is emitted.
   *
   * Visibility is controlled by `ConsoleLog.auditLogLevel` (`LOG_AUDIT` env var).
   */
  audit(key: string, payload: Record<string, unknown>): void {
    if (ConsoleLog.auditLogLevel === 'off') {
      return;
    }

    if (ConsoleLog.jsonOutput) {
      console.log(this.formatAuditJson(key, payload));
      return;
    }

    const extras = this.formatAuditTextExtras(payload);
    console.log(...this.getArgs(extras ? [`[audit] ${key} ${extras}`] : [`[audit] ${key}`]));
  }

  protected getArgs(args: Parameters<typeof console.log>): Parameters<typeof console.log> {
    const contextSuffix = this.formatTextContext();
    const paddedPrefix = this.prefix?.padEnd(this.padding);

    if (paddedPrefix && contextSuffix) {
      return [paddedPrefix, ...args, contextSuffix];
    }

    if (paddedPrefix) {
      return [paddedPrefix, ...args];
    }

    if (contextSuffix) {
      return [...args, contextSuffix];
    }

    return args;
  }

  /**
   * Serialises a log call into a single-line JSON string.
   *
   * Each argument is converted to a plain string (ANSI codes stripped, objects JSON-encoded,
   * Error instances expanded to `name: message`). The results are joined with a space into the
   * `message` field. When an `Error` is present its `stack` is included separately under `error`.
   * Any context set via `withContext()` is spread as top-level fields after `message`.
   */
  private formatJson(level: LogLevel, args: Parameters<typeof console.log>): string {
    const firstError = args.find((arg): arg is Error => arg instanceof Error);

    const entry: Record<string, unknown> = {
      level,
      time: Date.now(),
      message: args.map((arg) => this.serializeArg(arg)).join(' '),
      ...(this.prefix && { prefix: stripAnsi(this.prefix) }),
      ...this.context,
      ...(firstError && {
        error: { name: firstError.name, message: firstError.message, stack: firstError.stack },
      }),
    };

    return JSON.stringify(entry);
  }

  /** Serialises an audit log entry to a single-line JSON string with `level: "audit"`. */
  private formatAuditJson(key: string, payload: Record<string, unknown>): string {
    const record: Record<string, unknown> = {
      level: 'audit',
      time: Date.now(),
      ...(this.prefix && { prefix: stripAnsi(this.prefix) }),
      key,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      message: `[Audit] ${payload.key}`,
      ...payload,
    };

    return JSON.stringify(record);
  }

  /** Builds a chalk-grayed summary of the most useful audit fields for text-mode output. */
  private formatAuditTextExtras(payload: Record<string, unknown>): string | undefined {
    const { result, userId, applicationId } = payload;
    const parts = [
      result && `result=${String(result)}`,
      userId && `userId=${String(userId)}`,
      applicationId && `app=${String(applicationId)}`,
    ].filter(Boolean);

    return parts.length > 0 ? chalk.gray(parts.join(' ')) : undefined;
  }

  /** Serialises an HTTP log entry to a single-line JSON string with `level: "http"`. */
  private formatHttpJson(entry: HttpLogEntry): string {
    const entryPath = entry.path ?? entry.url;
    const record: Record<string, unknown> = {
      level: 'http',
      time: Date.now(),
      message: `Serving Request for ${entryPath}`,
      ...(this.prefix && { prefix: stripAnsi(this.prefix) }),
      method: entry.method,
      url: entry.url,
      ...this.buildHttpOptionalFields(entry),
    };

    return JSON.stringify(record);
  }

  /** Maps optional `HttpLogEntry` fields to their JSON output key names. */
  // eslint-disable-next-line complexity
  private buildHttpOptionalFields(entry: HttpLogEntry): Record<string, unknown> {
    const {
      ip,
      forwardedFor,
      forwardedProto,
      userAgent,
      host,
      amznTraceId,
      path,
      accepts,
      origin,
      requestHeaders,
      requestLength,
      statusCode,
      durationMs,
      responseLength,
      responseContentType,
    } = entry;
    return {
      ...(path && { path }),
      ...(ip && { ip }),
      ...(forwardedFor && { 'x-forwarded-for': forwardedFor }),
      ...(forwardedProto && { 'x-forwarded-proto': forwardedProto }),
      ...(userAgent && { 'user-agent': userAgent }),
      ...(host && { 'x-host': host }),
      ...(amznTraceId && { 'x-amzn-trace-id': amznTraceId }),
      ...(accepts && { accepts }),
      ...(origin && { origin }),
      ...(requestHeaders &&
        Object.keys(requestHeaders).length > 0 && { request_headers: requestHeaders }),
      ...(requestLength !== undefined && { request_length: requestLength }),
      ...(statusCode !== undefined && { status_code: statusCode }),
      ...(durationMs !== undefined && { duration_ms: durationMs }),
      ...(responseLength !== undefined && { response_length: responseLength }),
      ...(responseContentType && { response_content_type: responseContentType }),
    };
  }

  /**
   * Builds the chalk-grayed `key=value` suffix appended to the koa-logger text line.
   * Only fields not already shown in the koa string are included.
   */
  // eslint-disable-next-line complexity
  private formatHttpTextExtras(entry: HttpLogEntry): string | undefined {
    const {
      ip,
      forwardedFor,
      forwardedProto,
      userAgent,
      host,
      amznTraceId,
      accepts,
      origin,
      requestLength,
      statusCode,
      responseContentType,
    } = entry;
    // Req_len is only useful on request lines; the response line already shows response length.
    const isResponseLine = statusCode !== undefined;

    const parts = [
      ip && `ip=${ip}`,
      forwardedFor && `fwd=${forwardedFor}`,
      forwardedProto && `proto=${forwardedProto}`,
      userAgent && `ua=${userAgent}`,
      host && `host=${host}`,
      amznTraceId && `trace=${amznTraceId}`,
      accepts && `accepts=${accepts}`,
      origin && `origin=${origin}`,
      !isResponseLine && requestLength !== undefined && `req_len=${requestLength}`,
      isResponseLine && responseContentType && `ct=${responseContentType}`,
    ].filter(Boolean);

    return parts.length > 0 ? chalk.gray(parts.join(' ')) : undefined;
  }

  /** Returns a chalk-grayed `key=value` string for text-mode output, or `undefined` if no context is set. */
  private formatTextContext(): string | undefined {
    if (!this.context || Object.keys(this.context).length === 0) {
      return undefined;
    }

    return chalk.gray(
      Object.entries(this.context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
    );
  }

  private serializeArg(arg: unknown): string {
    if (arg === null) {
      return 'null';
    }
    if (arg === undefined) {
      return 'undefined';
    }
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }

    return stripAnsi(String(arg));
  }
}
