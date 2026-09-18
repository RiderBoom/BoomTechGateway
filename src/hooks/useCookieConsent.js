import { useState, useCallback } from 'react';

const CONSENT_KEY = 'boomtech_cookie_consent';

const defaultConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  decided: false,
  timestamp: null,
};

const readStoredConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? { ...defaultConsent, ...JSON.parse(stored) } : defaultConsent;
  } catch {
    return defaultConsent;
  }
};

export const useCookieConsent = () => {
  const [consent, setConsent] = useState(readStoredConsent);
  const [showBanner, setShowBanner] = useState(() => !readStoredConsent().decided);
  const [showSettings, setShowSettings] = useState(false);

  const persist = useCallback((partial) => {
    const data = {
      ...partial,
      necessary: true,
      decided: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable — consent still held in state for this session
    }
    setConsent(data);
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ analytics: true, marketing: true, preferences: true });
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ analytics: false, marketing: false, preferences: false });
  }, [persist]);

  const saveCustom = useCallback((custom) => {
    persist({ analytics: !!custom.analytics, marketing: !!custom.marketing, preferences: !!custom.preferences });
  }, [persist]);

  // Call this from a "จัดการคุกกี้" link in the footer to reopen the banner
  const reopenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  return { consent, showBanner, showSettings, setShowSettings, acceptAll, rejectAll, saveCustom, reopenSettings };
};
