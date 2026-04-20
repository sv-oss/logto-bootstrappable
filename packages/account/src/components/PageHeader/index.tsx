import { getBrandingLogoUrl } from '@experience/shared/utils/logo';
import { useLogto } from '@logto/react';
import { Theme } from '@logto/schemas';
import classNames from 'classnames';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import { accountCenterBasePath } from '@ac/utils/account-center-route';
import { getThemeBySystemPreference } from '@ac/utils/theme';

import styles from './index.module.scss';

const PageHeader = () => {
  const { t } = useTranslation();
  const { theme, appearanceMode, experienceSettings, setAppearanceMode, setTheme, userInfo } =
    useContext(PageContext);
  const { signOut } = useLogto();
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAppearanceSubmenu, setShowAppearanceSubmenu] = useState(false);

  const logoUrl =
    experienceSettings &&
    getBrandingLogoUrl({
      theme,
      branding: experienceSettings.branding,
      isDarkModeEnabled: experienceSettings.color.isDarkModeEnabled,
    });
  const fullName = [userInfo?.profile?.givenName, userInfo?.profile?.familyName]
    .filter(Boolean)
    .join(' ');
  const userName =
    (fullName.length > 0 ? fullName : undefined) ??
    userInfo?.name ??
    userInfo?.username ??
    userInfo?.primaryEmail ??
    'User';
  const initials = useMemo(() => {
    if (!userName) {
      return 'U';
    }

    return userName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  }, [userName]);
  const appearanceOptions: Array<{ value: 'system' | Theme.Light | Theme.Dark; label: string }> = [
    { value: 'system', label: 'Sync with system' },
    { value: Theme.Light, label: 'Light mode' },
    { value: Theme.Dark, label: 'Dark mode' },
  ];
  const canSelectAppearance = Boolean(experienceSettings?.color.isDarkModeEnabled);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const { target } = event;
      if (
        target instanceof Node &&
        !userButtonRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setShowDropdown(false);
      }
    };

    window.addEventListener('mousedown', onMouseDown);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  useEffect(() => {
    if (!showDropdown) {
      setShowAppearanceSubmenu(false);
    }
  }, [showDropdown]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {logoUrl && <img className={styles.logo} src={logoUrl} alt="Logto" />}
      </div>
      <div className={styles.right}>
        <div className={styles.userMenu}>
          <button
            ref={userButtonRef}
            type="button"
            className={classNames(styles.userButton, showDropdown && styles.active)}
            onClick={() => {
              setShowDropdown((open) => !open);
            }}
          >
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt={userName} className={styles.userAvatar} />
            ) : (
              <span className={styles.userAvatarPlaceholder}>{initials}</span>
            )}
          </button>
          {showDropdown && (
            <div ref={dropdownRef} className={styles.userDropdown}>
              <div className={styles.userName}>{userName}</div>
              {userInfo?.primaryEmail && (
                <div className={styles.userEmail}>{userInfo.primaryEmail}</div>
              )}
              {canSelectAppearance && (
                <div className={styles.menuRowContainer}>
                  <button
                    type="button"
                    className={styles.menuRow}
                    onClick={() => {
                      setShowAppearanceSubmenu((open) => !open);
                    }}
                  >
                    <span>Appearance</span>
                    <span className={styles.menuChevron}>›</span>
                  </button>
                  <div
                    className={`${styles.appearanceSubmenu}${showAppearanceSubmenu ? ` ${styles.visible}` : ''}`}
                  >
                    {appearanceOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.appearanceSubmenuOption}${appearanceMode === value ? ` ${styles.selected}` : ''}`}
                        onClick={() => {
                          setAppearanceMode(value);
                          setTheme(value === 'system' ? getThemeBySystemPreference() : value);
                          setShowAppearanceSubmenu(false);
                        }}
                      >
                        <span className={styles.appearanceTick}>
                          {appearanceMode === value ? '✓' : ''}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.menuRowContainer}>
                <button
                  type="button"
                  className={styles.signOutButton}
                  onClick={() => {
                    void signOut(`${window.location.origin}${accountCenterBasePath}`);
                  }}
                >
                  {t('account_center.home.sign_out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
