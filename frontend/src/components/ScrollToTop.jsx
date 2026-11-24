import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 1. Reset primary window scroll position instantly to (0, 0)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // 2. Also reset document root / body scroll positions if affected
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Reset any nested scrollable workspace containers
    const scrollableContainers = document.querySelectorAll(
      'main, .trainer-portal-container main, .overflow-y-auto, [data-scrollable="true"]'
    );
    scrollableContainers.forEach((el) => {
      if (el && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else if (el) {
        el.scrollTop = 0;
      }
    });
  }, [pathname, search, hash]);

  return null;
}
