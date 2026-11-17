export const THEME_STORAGE_KEY = 'vogric-theme'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Static, trusted bootstrap script. It runs before React paints so a stored
 * theme does not flash the default theme. The CSP nonce is applied by the root
 * layout; this module only owns the key and the script body.
 */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`
