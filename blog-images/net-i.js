/* Standalone image display adapter. Built with a verified per-site configuration.
   This does not generate, brand, upload, or replace image content. */
(function (w, d, config) {
  'use strict';
  var script = d.currentScript;
  var source = script && script.src;
  var previous = w.MSPL_BLOG_IMAGES;
  function announce(status, code, extra) {
    var state = Object.assign(w.MSPL_BLOG_IMAGES || {}, extra || {}, {status: status, code: code});
    w.MSPL_BLOG_IMAGES = state;
    d.documentElement.setAttribute('data-mspl-images-status', code);
    w.dispatchEvent(new CustomEvent('mspl:images-status', {detail: state}));
    if (status === 'error') console.warn('[MSPL blog images] ' + code + '. Check the site image installation and Designer attributes.', state);
  }
  if ((w.__MSPL_BLOG_IMAGES_LOAD && w.__MSPL_BLOG_IMAGES_LOAD.cancelled) ||
      (previous && /^(installation-conflict|installer-timeout|installer-failed)$/.test(previous.code))) return;
  if (previous && previous.configHash) {
    if (previous.configHash !== config.configHash || previous.assets.script !== source) announce('error', 'installation-conflict');
    return;
  }
  w.MSPL_BLOG_IMAGES = {contract: config.contract, version: config.version, siteId: d.documentElement.getAttribute('data-wf-site') || '', clientId: config.clientId, collectionId: config.collectionId, configHash: config.configHash, configFingerprint: config.configHash, heroCount: 0, thumbnailCount: 0, assets: {script: source}};
  if (w.MSPL_BLOG_IMAGES.siteId !== config.siteId) {announce('error', 'site-mismatch'); return;}
  if (d.querySelector('style[data-mspl-blog-images]')) {announce('error', 'legacy-installation'); return;}
  if (!source || !/@[a-f0-9]{40}\/blog-images\/[-a-z0-9]+\.js$/.test(new URL(source).pathname)) {announce('error', 'immutable-source-required'); return;}
  var protectedScope = 'header,nav,footer,[role="banner"],[role="navigation"],[role="contentinfo"],.mspl-author,.author-section,[data-mspl-author]';
  function query(selector) {try {return Array.from(d.querySelectorAll(selector));} catch (_) {throw Error('invalid-selector');}}
  function safe(element) {return !element.closest(protectedScope);}
  function roleImages(role, fallbacks) {
    var explicit = query('[data-mspl-' + role + ']');
    var images = explicit.length ? explicit : Array.from(new Set(fallbacks.flatMap(query)));
    if (images.some(function (e) {return e.tagName !== 'IMG' || !safe(e) || (explicit.length && e.getAttribute('data-mspl-' + role) !== 'true');})) throw Error(role + '-invalid');
    return images;
  }
  function prepare() {
    var errors = [], hero = [], thumbnails = [], wrappers = [];
    var explicitArticle = query('[data-mspl-article]');
    var roots = explicitArticle.length ? explicitArticle : query(config.rootSelector);
    var article = roots.length > 0;
    if (article && (roots.length !== 1 || !safe(roots[0]) || !roots[0].classList.contains('w-richtext') || (explicitArticle.length && roots[0].getAttribute('data-mspl-article') !== 'true'))) {
      errors.push('article-target-invalid'); article = false;
    }
    if (article) {
      try {hero = roleImages('hero', config.heroSelectors); if (hero.length !== 1) throw Error('hero-' + (hero.length ? 'ambiguous' : 'missing'));}
      catch (e) {errors.push(e.message); hero = [];}
    }
    try {
      thumbnails = roleImages('thumbnail', config.thumbnailSelectors);
      thumbnails.forEach(function (img) {
        var marked = img.hasAttribute('data-mspl-thumbnail');
        var candidates = config.thumbnailWrapperSelectors.map(function (selector) {return img.closest(selector);}).filter(Boolean);
        if (new Set(candidates).size > 1) throw Error('thumbnail-wrapper-ambiguous');
        var wrapper = candidates[0] || (marked ? img.parentElement : null);
        if (!wrapper || !safe(wrapper) || /^(BODY|HTML|MAIN|SECTION|ARTICLE)$/.test(wrapper.tagName) || wrapper.querySelectorAll('img').length !== 1 || wrapper.querySelectorAll('h1,h2,h3,p,button,.w-richtext').length) throw Error('thumbnail-wrapper-invalid');
        wrappers.push(wrapper);
      });
      if (hero.some(function (img) {return thumbnails.includes(img);})) throw Error('image-role-conflict');
    } catch (e) {errors.push(e.message); thumbnails = []; wrappers = []; if (e.message === 'image-role-conflict') hero = [];}
    return {hero: hero, thumbnails: thumbnails, wrappers: wrappers, errors: errors, article: article};
  }
  function start() {
    if (w.MSPL_BLOG_IMAGES.code === 'installation-conflict') return;
    if (d.documentElement.getAttribute('data-wf-site') !== config.siteId) {announce('error', 'site-mismatch'); return;}
    var targets;
    try {targets = prepare();} catch (e) {announce('error', e.message); return;}
    if (!targets.hero.length && !targets.thumbnails.length) {
      announce(targets.errors.length ? 'error' : 'not-applicable', targets.errors[0] || 'no-blog-images', {diagnostics: targets.errors}); return;
    }
    var css = new URL('../blog-images.css', source).href;
    var link = d.createElement('link'); link.rel = 'stylesheet'; link.href = css;
    link.integrity = config.cssIntegrity; link.crossOrigin = 'anonymous'; link.setAttribute('data-mspl-images-css', config.version);
    w.MSPL_BLOG_IMAGES.assets.css = css; w.MSPL_BLOG_IMAGES.assets.cssIntegrity = config.cssIntegrity;
    announce('loading', 'stylesheet-loading');
    var completed = false;
    var timer = setTimeout(function () {finish(false);}, 15000);
    function finish(success) {
      if (completed) return; completed = true; clearTimeout(timer);
      if (!success) {link.remove(); announce('error', 'stylesheet-failed'); return;}
      if ((w.__MSPL_BLOG_IMAGES_LOAD && w.__MSPL_BLOG_IMAGES_LOAD.cancelled) || /^(installation-conflict|installer-timeout|installer-failed)$/.test(w.MSPL_BLOG_IMAGES.code)) {link.remove(); return;}
      if (d.documentElement.getAttribute('data-wf-site') !== config.siteId) {link.remove(); announce('error', 'site-mismatch'); return;}
      // Re-resolve after network delay so replaced or newly ambiguous targets are never mutated.
      try {targets = prepare();} catch (e) {announce('error', e.message); return;}
      targets.hero.forEach(function (e) {e.setAttribute('data-mspl-image-owned', 'hero');});
      targets.thumbnails.forEach(function (e) {e.setAttribute('data-mspl-image-owned', 'thumbnail');});
      targets.wrappers.forEach(function (e) {e.setAttribute('data-mspl-image-wrapper', 'thumbnail');});
      announce(targets.errors.length ? 'error' : 'ready', targets.errors[0] || (targets.article ? 'article-images-ready' : 'cards-ready'), {heroCount: targets.hero.length, thumbnailCount: targets.thumbnails.length, diagnostics: targets.errors, stylesheetLoaded: true});
    }
    link.onload = function () {finish(true);}; link.onerror = function () {finish(false);}; d.head.appendChild(link);
  }
  announce('loading', 'dom-loading');
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})(window, document, {"contract":"mspl-blog-images-v1","version":"1.0.0","slug":"net-i","siteId":"69c0f0ab3dd67932fbaaf55f","clientId":"rec0R5Vzxx7mr3TeJ","collectionId":"69c0f0ab3dd67932fbaaf5ba","rootSelector":".mg-bottom--16px > .rich-text.w-richtext","heroSelectors":["img[data-mspl-hero=\"true\"]"],"thumbnailSelectors":[".blog-card > .card-picture > img.card-image",".blog-mini-card > .card-picture > img.card-image"],"thumbnailWrapperSelectors":[".blog-card > .card-picture",".blog-mini-card > .card-picture"],"configHash":"500b6562c137f6fdfadb416515821f81ee0af954c96bfd7ed6218519a940fc0a","cssIntegrity":"sha384-lAjz+tIV37BOhLjc+XcfeGmOD1bUl0BtCGkHfzaLEJVkyHf5vCyQ37UL49siBr72"});
