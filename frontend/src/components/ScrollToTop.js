import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * react-router keeps the scroll position between route changes; with a
 * fixed-top navbar that makes a freshly opened page appear "scrolled".
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
