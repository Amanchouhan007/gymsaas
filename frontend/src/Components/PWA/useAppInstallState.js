import { useState, useEffect, useCallback } from 'react';
import { ANDROID_APK_URL, ANDROID_APK_VERSION } from '../../config/appLinks';

const getApkKey = () => `gym_app_apk_done_v${ANDROID_APK_VERSION}`;
const IOS_KEY = 'gym_app_ios_done';

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch (e) {
    return false;
  }
};

const safeSetItem = (key, val) => {
  try {
    localStorage.setItem(key, String(val));
  } catch (e) {
    // Storage quota or blocked
  }
};

export const detectPlatform = () => {
  if (typeof window === 'undefined' || !navigator) return 'desktop';
  const ua = (navigator.userAgent || '').toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  if (ua.includes('android')) {
    return 'android';
  }

  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isMacPad = ua.includes('macintosh') && maxTouchPoints > 1;

  if (isIosDevice || isMacPad) {
    return 'ios';
  }

  return 'desktop';
};

export const isInsideApp = () => {
  if (typeof window === 'undefined') return false;
  const standaloneMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = window.navigator && window.navigator.standalone === true;
  const twaReferrer = typeof document !== 'undefined' && document.referrer && document.referrer.startsWith('android-app://');

  return Boolean(standaloneMedia || navStandalone || twaReferrer);
};

export function useAppInstallState() {
  const [platform] = useState(() => detectPlatform());
  const [inApp] = useState(() => isInsideApp());
  
  // Synchronous initial state from localStorage to prevent flicker
  const [apkDone, setApkDone] = useState(() => safeGetItem(getApkKey()));
  const [iosDone, setIosDone] = useState(() => safeGetItem(IOS_KEY));

  const markAndroidDone = useCallback(() => {
    safeSetItem(getApkKey(), true);
    setApkDone(true);
  }, []);

  const markIOSDone = useCallback(() => {
    safeSetItem(IOS_KEY, true);
    setIosDone(true);
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      markAndroidDone();
      markIOSDone();
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Best effort: check navigator.getInstalledRelatedApps
    if (navigator && typeof navigator.getInstalledRelatedApps === 'function') {
      navigator.getInstalledRelatedApps()
        .then(relatedApps => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            markAndroidDone();
          }
        })
        .catch(() => {
          // Ignore error
        });
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [markAndroidDone, markIOSDone]);

  let showAndroid = false;
  let showIOS = false;
  let showReinstallLink = false;

  if (!inApp) {
    if (platform === 'android') {
      showAndroid = !apkDone;
      showReinstallLink = apkDone;
    } else if (platform === 'ios') {
      showIOS = !iosDone;
      showReinstallLink = iosDone;
    } else {
      // desktop: Always show both buttons on desktop so visitors can download APK or view iOS guide anytime
      showAndroid = true;
      showIOS = true;
      showReinstallLink = false;
    }
  }

  return {
    platform,
    inApp,
    showAndroid,
    showIOS,
    showReinstallLink,
    markAndroidDone,
    markIOSDone,
    apkDone,
    iosDone
  };
}

export default useAppInstallState;
