import { AccountCenterControlValue } from '@logto/schemas';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './index.module.scss';

export type FieldRowProps = {
  readonly label: string;
  readonly value?: ReactNode;
  readonly icon?: ReactNode;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

export const FieldRow = ({ label, value, icon, actionLabel, onAction }: FieldRowProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>
        {icon && <span className={styles.fieldIcon}>{icon}</span>}
        {label}
      </span>
      <span className={`${styles.fieldValue}${value ? '' : ` ${styles.notSet}`}`}>
        {value ?? t('account_center.home.not_set')}
      </span>
      {actionLabel && onAction && (
        <div className={styles.fieldAction}>
          <button type="button" className={styles.rowActionButton} onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export const editAction = (
  controlValue: AccountCenterControlValue | undefined,
  hasValue: boolean
): TFuncKey | undefined =>
  controlValue === AccountCenterControlValue.Edit
    ? hasValue
      ? 'account_center.home.action_edit'
      : 'account_center.home.action_add'
    : undefined;
