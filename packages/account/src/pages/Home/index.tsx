import Button from '@experience/shared/components/Button';
import { useLogto } from '@logto/react';
import {
  AccountCenterControlValue,
  MfaFactor,
  type AccountCenterFieldControl,
} from '@logto/schemas';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { getMfaVerifications } from '@ac/apis/mfa';
import BackupCodeIcon from '@ac/assets/icons/factor-backup-code.svg?react';
import TotpIcon from '@ac/assets/icons/factor-totp.svg?react';
import WebAuthnIcon from '@ac/assets/icons/factor-webauthn.svg?react';
import {
  authenticatorAppManageRoute,
  authenticatorAppRoute,
  backupCodesManageRoute,
  passkeyManageRoute,
  passwordRoute,
} from '@ac/constants/routes';
import useApi from '@ac/hooks/use-api';
import { accountCenterBasePath } from '@ac/utils/account-center-route';

import { FieldRow } from './FieldRow';
import PersonalInfoSection, { checkHasPersonalInfoFields } from './PersonalInfoSection';
import styles from './index.module.scss';

const { Off: OffValue } = AccountCenterControlValue;

const checkHasSecurityFields = (fields: AccountCenterFieldControl): boolean =>
  fields.password !== OffValue || fields.mfa !== OffValue;

type SecuritySectionProps = {
  readonly fields: AccountCenterFieldControl;
  readonly navigate: ReturnType<typeof useNavigate>;
};

type PasswordSectionProps = SecuritySectionProps & {
  readonly hasPassword: boolean;
};

type TwoFactorSectionProps = SecuritySectionProps & {
  readonly hasTotpSetup: boolean;
  readonly passkeyCount: number;
};

type CustomDataSectionProps = {
  readonly customData?: unknown;
};

const PasswordSection = ({ fields, hasPassword, navigate }: PasswordSectionProps) => {
  const { t } = useTranslation();
  const { Off, Edit } = AccountCenterControlValue;

  if (fields.password === Off) {
    return null;
  }

  return (
    <section className={styles.settingsCard}>
      <div className={styles.settingsLabel}>
        {t('account_center.home.security_section').toUpperCase()}
      </div>
      <div className={styles.settingsContent}>
        <div className={styles.settingsTitle}>{t('account_center.home.field_password')}</div>
        <div className={styles.card}>
          <FieldRow
            label={t('account_center.home.field_password')}
            value={hasPassword ? '********' : undefined}
            actionLabel={
              fields.password === Edit
                ? t(
                    hasPassword
                      ? 'account_center.home.action_edit'
                      : 'account_center.home.action_add'
                  )
                : undefined
            }
            onAction={() => {
              navigate(passwordRoute);
            }}
          />
        </div>
      </div>
    </section>
  );
};

const TwoFactorSection = ({
  fields,
  hasTotpSetup,
  passkeyCount,
  navigate,
}: TwoFactorSectionProps) => {
  const { t } = useTranslation();
  const { Off, Edit } = AccountCenterControlValue;

  if (fields.mfa === Off) {
    return null;
  }

  return (
    <section className={styles.settingsCard}>
      <div className={styles.settingsLabel}>
        {t('account_center.security.two_step_verification').toUpperCase()}
      </div>
      <div className={styles.settingsContent}>
        <div className={styles.settingsTitle}>
          {t('account_center.security.two_step_verification')}
        </div>
        <div className={styles.settingsDescription}>
          {t('account_center.page.security_description')}
        </div>
        <div className={styles.card}>
          <FieldRow
            label={t('account_center.home.field_passkeys')}
            icon={<WebAuthnIcon className={styles.factorIcon} />}
            value={
              passkeyCount > 0
                ? t('account_center.home.passkeys_count', { count: passkeyCount })
                : undefined
            }
            actionLabel={fields.mfa === Edit ? t('account_center.home.manage') : undefined}
            onAction={() => {
              navigate(passkeyManageRoute);
            }}
          />
          <FieldRow
            label={t('account_center.home.field_authenticator_app')}
            icon={<TotpIcon className={styles.factorIcon} />}
            value={hasTotpSetup ? t('account_center.home.totp_active') : undefined}
            actionLabel={fields.mfa === Edit ? t('account_center.home.manage') : undefined}
            onAction={() => {
              navigate(hasTotpSetup ? authenticatorAppManageRoute : authenticatorAppRoute);
            }}
          />
          <FieldRow
            label={t('account_center.home.field_backup_codes')}
            icon={<BackupCodeIcon className={styles.factorIcon} />}
            actionLabel={fields.mfa === Edit ? t('account_center.home.manage') : undefined}
            onAction={() => {
              navigate(backupCodesManageRoute);
            }}
          />
        </div>
      </div>
    </section>
  );
};

const CustomDataSection = ({ customData }: CustomDataSectionProps) => {
  if (!customData || typeof customData !== 'object' || Object.keys(customData).length === 0) {
    return null;
  }

  const customDataJson = JSON.stringify(customData, null, 2);

  return (
    <section className={styles.settingsCard}>
      <div className={styles.settingsLabel}>CUSTOM DATA</div>
      <div className={styles.settingsContent}>
        <div className={styles.settingsTitle}>Custom data</div>
        <div className={styles.card}>
          <div className={styles.codeEditor}>
            <SyntaxHighlighter
              language="json"
              useInlineStyles={false}
              customStyle={{ margin: 0 }}
              className={styles.syntaxCode}
            >
              {customDataJson}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accountCenterSettings, userInfo } = useContext(PageContext);
  const getMfaRequest = useApi(getMfaVerifications, { silent: true });
  const [hasTotpSetup, setHasTotpSetup] = useState(false);
  const [passkeyCount, setPasskeyCount] = useState(0);
  const { signOut } = useLogto();

  const fields = accountCenterSettings?.fields ?? {};

  useEffect(() => {
    const checkMfa = async () => {
      const [, result] = await getMfaRequest();
      if (result) {
        setHasTotpSetup(result.some((mfa) => mfa.type === MfaFactor.TOTP));
        setPasskeyCount(result.filter((mfa) => mfa.type === MfaFactor.WebAuthn).length);
      }
    };
    void checkMfa();
  }, [getMfaRequest]);

  const hasPersonalInfo = checkHasPersonalInfoFields(fields);
  const hasSecurity = checkHasSecurityFields(fields);
  const hasAnyFields = hasPersonalInfo || hasSecurity;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('account_center.home.title')}</h1>
        <p className={styles.pageDescription}>{t('account_center.home.description')}</p>
      </div>
      {hasAnyFields ? (
        <>
          <PersonalInfoSection fields={fields} userInfo={userInfo} navigate={navigate} />
          <PasswordSection
            fields={fields}
            hasPassword={userInfo?.hasPassword ?? false}
            navigate={navigate}
          />
          <TwoFactorSection
            fields={fields}
            hasTotpSetup={hasTotpSetup}
            passkeyCount={passkeyCount}
            navigate={navigate}
          />
          <CustomDataSection customData={userInfo?.customData} />
        </>
      ) : (
        <p className={styles.emptyState}>{t('account_center.home.no_fields_available')}</p>
      )}
      <Button
        className={styles.mobileSignOut}
        title="account_center.home.sign_out"
        type="secondary"
        onClick={() => {
          void signOut(`${window.location.origin}${accountCenterBasePath}`);
        }}
      />
    </div>
  );
};

export default Home;
