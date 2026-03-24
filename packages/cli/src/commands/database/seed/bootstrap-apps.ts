import {
  type Role,
  ApplicationType,
  Applications,
  ApplicationsRoles,
  Roles,
  defaultTenantId,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type DatabaseTransactionConnection, sql } from '@silverhand/slonik';

import { insertInto } from '../../../database.js';
import { convertToIdentifiers } from '../../../sql.js';
import { consoleLog } from '../../../utils.js';

import type { AppConfig, M2mConfig } from './bootstrap-config.js';

/**
 * Registers a Traditional (server-side) OIDC application in the default tenant.
 *
 * Creates both the application record and its associated `Default` application secret so the
 * app can immediately authenticate against Logto using the configured client credentials.
 *
 * @param connection - Active database transaction connection.
 * @param config - Application metadata and OAuth settings from {@link getAppConfig}.
 */
export const bootstrapApplication = async (
  connection: DatabaseTransactionConnection,
  config: AppConfig
) => {
  await connection.query(
    insertInto(
      {
        tenantId: defaultTenantId,
        id: config.clientId,
        name: config.name,
        secret: config.clientSecret,
        description: `Bootstrapped application: ${config.name}`,
        type: ApplicationType.Traditional,
        oidcClientMetadata: {
          redirectUris: config.redirectUris,
          postLogoutRedirectUris: config.postLogoutRedirectUris,
        },
        customClientMetadata: {},
        isThirdParty: false,
        customData: {},
      },
      Applications.table
    )
  );

  await connection.query(
    insertInto(
      {
        tenantId: defaultTenantId,
        applicationId: config.clientId,
        name: 'Default',
        value: config.clientSecret,
      },
      'application_secrets'
    )
  );

  consoleLog.succeed(
    `Created Traditional application "${config.name}" (client_id: ${config.clientId})`
  );
};

/**
 * Registers a Machine-to-Machine (M2M) application in the default tenant and assigns it the
 * pre-configured "Logto Management API access" role so it can immediately authenticate against
 * the Management API using the client-credentials grant.
 *
 * @param connection - Active database transaction connection.
 * @param config - M2M application credentials from {@link getM2mConfig}.
 */
export const bootstrapM2mApplication = async (
  connection: DatabaseTransactionConnection,
  config: M2mConfig
) => {
  await connection.query(
    insertInto(
      {
        tenantId: defaultTenantId,
        id: config.clientId,
        name: config.name,
        secret: config.clientSecret,
        description: `Bootstrapped M2M application: ${config.name}`,
        type: ApplicationType.MachineToMachine,
        oidcClientMetadata: { redirectUris: [], postLogoutRedirectUris: [] },
        customClientMetadata: {},
        isThirdParty: false,
        customData: {},
      },
      Applications.table
    )
  );

  await connection.query(
    insertInto(
      {
        tenantId: defaultTenantId,
        applicationId: config.clientId,
        name: 'Default',
        value: config.clientSecret,
      },
      'application_secrets'
    )
  );

  const roles = convertToIdentifiers(Roles);
  const managementApiRole = await connection.one<Role>(sql`
    select ${roles.fields.id} from ${roles.table}
    where ${roles.fields.tenantId} = ${defaultTenantId}
    and ${roles.fields.name} = ${'Logto Management API access'}
  `);

  await connection.query(
    insertInto(
      {
        tenantId: defaultTenantId,
        id: generateStandardId(),
        applicationId: config.clientId,
        roleId: managementApiRole.id,
      },
      ApplicationsRoles.table
    )
  );

  consoleLog.succeed(
    `Created M2M application "${config.name}" (client_id: ${config.clientId}) with Management API access`
  );
};
