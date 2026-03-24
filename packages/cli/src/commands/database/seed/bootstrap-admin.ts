import {
  AdminTenantRole,
  OrganizationRoleUserRelations,
  OrganizationUserRelations,
  type Role,
  Roles,
  SignInExperiences,
  SignInMode,
  TenantRole,
  Users,
  UsersPasswordEncryptionMethod,
  UsersRoles,
  adminTenantId,
  defaultManagementApiAdminName,
  defaultTenantId,
  getTenantOrganizationId,
  getTenantRole,
} from '@logto/schemas';
import { generateStandardId, generateStandardShortId } from '@logto/shared';
import { type DatabaseTransactionConnection, sql } from '@silverhand/slonik';

import { insertInto } from '../../../database.js';
import { convertToIdentifiers } from '../../../sql.js';
import { encryptPassword } from '../../../utils/password.js';
import { consoleLog } from '../../../utils.js';

import type { AdminConfig } from './bootstrap-config.js';

/**
 * Creates the initial admin user in the admin tenant and wires up all required role and
 * organisation memberships.
 *
 * Specifically:
 * - Inserts the user row with an Argon2i-hashed password.
 * - Assigns the `User` admin-tenant role and the default management-API admin role.
 * - Adds the user to the default tenant's organisation with the `Admin` organisation role.
 * - Switches the admin tenant's sign-in experience to sign-in-only mode so no further
 *   self-registration is possible via the admin console.
 *
 * @param connection - Active database transaction connection.
 * @param config - Admin user credentials and optional email from {@link getAdminConfig}.
 */
export const bootstrapAdminUser = async (
  connection: DatabaseTransactionConnection,
  config: AdminConfig
) => {
  const userId = generateStandardShortId();
  const passwordEncrypted = await encryptPassword(config.password);

  await connection.query(
    insertInto(
      {
        tenantId: adminTenantId,
        id: userId,
        username: config.username,
        primaryEmail: config.email ?? null,
        passwordEncrypted,
        passwordEncryptionMethod: UsersPasswordEncryptionMethod.Argon2i,
        profile: {},
      },
      Users.table
    )
  );

  const roles = convertToIdentifiers(Roles);
  const userRole = await connection.one<Role>(sql`
    select ${roles.fields.id} from ${roles.table}
    where ${roles.fields.tenantId} = ${adminTenantId}
    and ${roles.fields.name} = ${AdminTenantRole.User}
  `);
  const managementRole = await connection.one<Role>(sql`
    select ${roles.fields.id} from ${roles.table}
    where ${roles.fields.tenantId} = ${adminTenantId}
    and ${roles.fields.name} = ${defaultManagementApiAdminName}
  `);

  await Promise.all([
    connection.query(
      insertInto(
        { id: generateStandardId(), userId, roleId: userRole.id, tenantId: adminTenantId },
        UsersRoles.table
      )
    ),
    connection.query(
      insertInto(
        { id: generateStandardId(), userId, roleId: managementRole.id, tenantId: adminTenantId },
        UsersRoles.table
      )
    ),
  ]);

  const organizationId = getTenantOrganizationId(defaultTenantId);
  await connection.query(
    insertInto({ userId, organizationId, tenantId: adminTenantId }, OrganizationUserRelations.table)
  );
  await connection.query(
    insertInto(
      {
        userId,
        organizationRoleId: getTenantRole(TenantRole.Admin).id,
        organizationId,
        tenantId: adminTenantId,
      },
      OrganizationRoleUserRelations.table
    )
  );

  await connection.query(sql`
    update ${sql.identifier([SignInExperiences.table])}
    set ${sql.identifier(['sign_in_mode'])} = ${SignInMode.SignIn}
    where ${sql.identifier(['tenant_id'])} = ${adminTenantId}
  `);

  consoleLog.succeed(
    `Created admin user "${config.username}" with admin roles and organization membership`
  );
};
