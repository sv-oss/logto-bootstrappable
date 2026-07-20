/** Fork-only keys used by the custom Account Center home page and TotpManage page. */

export const home = Object.freeze({
  title: 'My Account',
  description: 'Manage your profile and account security.',
  personal_info_section: 'Personal information',
  security_section: 'Security',
  not_set: 'Not set',
  action_edit: 'Edit',
  action_add: 'Add',
  action_view: 'View',
  manage: 'Manage',
  field_name: 'Display name',
  field_avatar: 'Avatar',
  field_username: 'Username',
  field_email: 'Email address',
  field_phone: 'Phone number',
  field_given_name: 'Given name',
  field_family_name: 'Family name',
  field_password: 'Password',
  field_2fa: 'Two-factor authentication',
  field_authenticator_app: 'Authenticator app',
  field_passkeys: 'Passkeys',
  field_backup_codes: 'Backup codes',
  password_set: 'Set',
  password_not_set: 'Not set',
  totp_active: 'Active',
  passkeys_count: '{{count}} passkey registered',
  passkeys_count_plural: '{{count}} passkeys registered',
  no_fields_available:
    'No user attributes are available for editing, please contact your administrator.',
  return_to_account: 'Back to account',
  sign_out: 'Sign out',
});

export const mfaForkKeys = Object.freeze({
  totp_manage_title: 'Manage authenticator app',
  totp_manage_description:
    'Your authenticator app is currently active. Remove it to disable OTP two-factor authentication.',
  totp_remove: 'Remove authenticator app',
  totp_removed: 'Authenticator app removed.',
  totp_remove_confirm_description:
    'Are you sure you want to remove your authenticator app? You will no longer be able to use it for two-factor authentication.',
});
