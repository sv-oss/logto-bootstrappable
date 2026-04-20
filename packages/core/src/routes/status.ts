import { timingSafeEqual } from 'node:crypto';

import { trySafe } from '@silverhand/essentials';
import type { Context, Next } from 'koa';

import koaGuard from '#src/middleware/koa-guard.js';

import { EnvSet } from '../env-set/index.js';

import type { AnonymousRouter, RouterInitArgs } from './types.js';

const getSingleHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) || value === undefined ? undefined : value;

export default function statusRoutes<T extends AnonymousRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const handleStatusRequest = async (ctx: Context, next: Next) => {
    ctx.status = 204;

    const statusApiKeyHeader = getSingleHeader(ctx.request.headers['logto-status-api-key']);
    if (
      EnvSet.values.statusApiKey &&
      statusApiKeyHeader &&
      trySafe(() =>
        timingSafeEqual(Buffer.from(EnvSet.values.statusApiKey), Buffer.from(statusApiKeyHeader))
      )
    ) {
      ctx.set('logto-tenant-id', tenant.id);
    }

    return next();
  };

  router.get('/status', koaGuard({ status: 204 }), handleStatusRequest);
}
