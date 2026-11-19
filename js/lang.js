/**
 * Alys Café — Language bootstrap (js/lang.js)
 * Loaded synchronously in <head> so the correct language is applied before first paint.
 *
 * Priority:
 *   1. ?lang=pt|en in the URL (e.g. coming from the main page to /curriculo)
 *   2. Language the visitor explicitly picked with the PT/EN switch (localStorage)
 *   3. Browser language: Portuguese -> 'pt', anything else -> 'en'
 */
(function () {
  var PREF_KEY = 'alyscafe_lang_pref';
  var SUPPORTED = ['pt', 'en'];

  function normalize(value) {
    if (!value) return null;
    var v = String(value).toLowerCase().slice(0, 2);
    return SUPPORTED.indexOf(v) !== -1 ? v : null;
  }

  function fromUrl() {
    try {
      return normalize(new URLSearchParams(window.location.search).get('lang'));
    } catch (e) {
      return null;
    }
  }

  function fromStorage() {
    try {
      return normalize(localStorage.getItem(PREF_KEY));
    } catch (e) {
      return null;
    }
  }

  function fromBrowser() {
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    var primary = String(langs[0] || '').toLowerCase();
    return primary.indexOf('pt') === 0 ? 'pt' : 'en';
  }

  function apply(lang) {
    var html = document.documentElement;
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');
    refreshLinks();
  }

  /**
   * Links marked with data-lang-link="<base href>" always carry the current language,
   * e.g. <a data-lang-link="curriculo" href="curriculo"> -> href="curriculo?lang=en".
   */
  function refreshLinks() {
    if (!document.querySelectorAll) return;
    var links = document.querySelectorAll('a[data-lang-link]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', withLang(links[i].getAttribute('data-lang-link')));
    }
  }

  /** Persist an explicit choice made with the PT/EN switch. */
  function save(lang) {
    lang = normalize(lang);
    if (!lang) return;
    try { localStorage.setItem(PREF_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  /** Append ?lang=<current> to a URL (keeps hash and other params). */
  function withLang(href, lang) {
    try {
      var url = new URL(href, window.location.href);
      url.searchParams.set('lang', lang || current());
      return url.origin === window.location.origin
        ? url.pathname + url.search + url.hash
        : url.toString();
    } catch (e) {
      return href;
    }
  }

  function current() {
    return normalize(document.documentElement.getAttribute('data-lang')) || 'pt';
  }

  var initial = fromUrl() || fromStorage() || fromBrowser();
  apply(initial);
  document.addEventListener('DOMContentLoaded', refreshLinks);

  window.alysLang = {
    initial: initial,
    apply: apply,
    save: save,
    current: current,
    withLang: withLang
  };
})();
