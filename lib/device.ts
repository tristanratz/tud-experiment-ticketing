export const isLikelyMobile = (): boolean => {
  if (typeof window === 'undefined') return false;

  const windowWithOpera = window as Window & { opera?: string };
  const ua = navigator.userAgent || navigator.vendor || windowWithOpera.opera || '';
  const isMobileUa = /Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini/i.test(ua);
  const coarsePointer = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  const narrowScreen = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 767px)').matches
    : false;

  return isMobileUa || (coarsePointer && narrowScreen);
};
