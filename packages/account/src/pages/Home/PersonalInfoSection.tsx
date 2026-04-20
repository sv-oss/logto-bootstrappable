import { formatPhoneNumberWithCountryCallingCode } from '@experience/utils/country-code';
import { AccountCenterControlValue, type AccountCenterFieldControl } from '@logto/schemas';
import type { TFuncKey } from 'i18next';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { type useNavigate } from 'react-router-dom';

import type { PageContextType } from '@ac/Providers/PageContextProvider/PageContext';
import { emailRoute, phoneRoute, profileRoute, usernameRoute } from '@ac/constants/routes';

import { FieldRow } from './FieldRow';
import styles from './index.module.scss';

const { Off: OffValue } = AccountCenterControlValue;
type PersonalInfoFieldKey = 'name' | 'profile' | 'avatar' | 'username' | 'email' | 'phone';

export const checkHasPersonalInfoFields = (fields: AccountCenterFieldControl): boolean =>
  fields.name !== OffValue ||
  fields.avatar !== OffValue ||
  fields.username !== OffValue ||
  fields.email !== OffValue ||
  fields.phone !== OffValue ||
  fields.profile !== OffValue;

type FieldConfig = {
  readonly fieldKey: PersonalInfoFieldKey;
  readonly labelKey: TFuncKey;
  readonly value: ReactNode;
  readonly hasValue: boolean;
  readonly route: string;
};

type PersonalInfoSectionProps = {
  readonly fields: AccountCenterFieldControl;
  readonly userInfo: PageContextType['userInfo'];
  readonly navigate: ReturnType<typeof useNavigate>;
};

const PersonalInfoSection = ({ fields, userInfo, navigate }: PersonalInfoSectionProps) => {
  const { t } = useTranslation();
  const fullName = [userInfo?.profile?.givenName, userInfo?.profile?.familyName]
    .filter(Boolean)
    .join(' ');
  const displayName =
    (fullName.length > 0 ? fullName : undefined) ?? userInfo?.name ?? userInfo?.username;
  const initials = displayName
    ? displayName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
    : (userInfo?.primaryEmail?.[0] ?? '?');
  const avatarValue = userInfo?.avatar ? (
    <img
      src={userInfo.avatar}
      alt={displayName ?? t('account_center.home.field_avatar')}
      className={styles.rowAvatar}
    />
  ) : (
    <div className={styles.rowAvatarPlaceholder}>{initials}</div>
  );

  const fieldConfigs: FieldConfig[] = [
    {
      fieldKey: 'name',
      labelKey: 'account_center.home.field_name',
      value: userInfo?.name ?? undefined,
      hasValue: Boolean(userInfo?.name),
      route: profileRoute,
    },
    {
      fieldKey: 'profile',
      labelKey: 'account_center.home.field_given_name',
      value: userInfo?.profile?.givenName,
      hasValue: Boolean(userInfo?.profile?.givenName),
      route: profileRoute,
    },
    {
      fieldKey: 'profile',
      labelKey: 'account_center.home.field_family_name',
      value: userInfo?.profile?.familyName,
      hasValue: Boolean(userInfo?.profile?.familyName),
      route: profileRoute,
    },
    {
      fieldKey: 'avatar',
      labelKey: 'account_center.home.field_avatar',
      value: avatarValue,
      hasValue: true,
      route: profileRoute,
    },
    {
      fieldKey: 'username',
      labelKey: 'account_center.home.field_username',
      value: userInfo?.username ?? undefined,
      hasValue: Boolean(userInfo?.username),
      route: usernameRoute,
    },
    {
      fieldKey: 'email',
      labelKey: 'account_center.home.field_email',
      value: userInfo?.primaryEmail ?? undefined,
      hasValue: Boolean(userInfo?.primaryEmail),
      route: emailRoute,
    },
    {
      fieldKey: 'phone',
      labelKey: 'account_center.home.field_phone',
      value: userInfo?.primaryPhone
        ? formatPhoneNumberWithCountryCallingCode(userInfo.primaryPhone)
        : undefined,
      hasValue: Boolean(userInfo?.primaryPhone),
      route: phoneRoute,
    },
  ];

  const controlByField: Record<PersonalInfoFieldKey, AccountCenterControlValue | undefined> = {
    name: fields.name,
    profile: fields.profile,
    avatar: fields.avatar,
    username: fields.username,
    email: fields.email,
    phone: fields.phone,
  };

  const visibleFields = fieldConfigs.filter(
    ({ fieldKey }) => controlByField[fieldKey] !== OffValue
  );

  if (visibleFields.length === 0) {
    return null;
  }

  const sectionLabel = t('account_center.home.personal_info_section').toUpperCase();

  return (
    <section className={styles.settingsCard}>
      <div className={styles.settingsLabel}>{sectionLabel}</div>
      <div className={styles.settingsContent}>
        <div className={styles.settingsTitle}>{t('account_center.home.personal_info_section')}</div>
        <div className={styles.card}>
          {visibleFields.map(({ fieldKey, labelKey, value, hasValue, route }) => {
            const actionKey: TFuncKey | undefined =
              controlByField[fieldKey] === AccountCenterControlValue.Edit
                ? hasValue
                  ? 'account_center.home.action_edit'
                  : 'account_center.home.action_add'
                : undefined;

            return (
              <FieldRow
                key={labelKey}
                label={String(t(labelKey))}
                value={value}
                actionLabel={actionKey ? String(t(actionKey)) : undefined}
                onAction={() => {
                  navigate(route);
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PersonalInfoSection;
