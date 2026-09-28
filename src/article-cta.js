/* Shared native CTA presentation. Profiles contain validated tokens, never
 * reference-page HTML. Editorial nodes and rc.19 destination recovery stay owned
 * by the existing layout adapter; decoration runs only after that adapter.
 */
var articleCta = (function () {
  'use strict';
  var prepared = new WeakMap();
  function fail(code) { var e = new Error('Article CTA: ' + code); e.articleCode = 'cta-' + code; throw e; }
  function readProfile(root) {
    var doc = root.ownerDocument;
    var scripts = doc.querySelectorAll('[id="mspl-cta-profile"]');
    var styles = doc.querySelectorAll('[data-mspl-cta-style]');
    if (!scripts.length && !styles.length) return null;
    if (scripts.length !== 1 || styles.length !== 1 || scripts[0].tagName !== 'SCRIPT' || scripts[0].type !== 'application/json' || styles[0].tagName !== 'STYLE') fail('profile-invalid');
    var style = styles[0], media = (style.getAttribute('media') || '').trim().toLowerCase();
    if (scripts[0].hasAttribute('src') || style.hasAttribute('disabled') || style.disabled || !style.sheet || style.sheet.disabled || style.hasAttribute('title') || style.hasAttribute('src') || (style.type && style.type !== 'text/css') || (media && media !== 'all' && media !== 'screen')) fail('profile-invalid');
    try {
      var profile = JSON.parse(scripts[0].textContent);
      CP.validate(profile, {clientId:profile.clientId, siteId:doc.documentElement.getAttribute('data-wf-site') || ''});
      if (styles[0].getAttribute('data-mspl-cta-style') !== profile.hash || styles[0].textContent !== CP.css(profile)) fail('profile-invalid');
      return profile;
    } catch (e) { fail('profile-invalid'); }
  }
  function each(nodes, fn) { Array.prototype.forEach.call(nodes, fn); }
  function undecorate(card) {
    // Only our marked decoration may disappear. Move original inline nodes back
    // in place, so an editor unlink still leaves the complete rc.19 action line.
    each(card.querySelectorAll('[data-mspl-cta-decoration="arrow"]'), function(n) { n.remove(); });
    each(card.querySelectorAll('[data-mspl-cta-decoration="label"]'), function(n) {
      while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
      n.remove();
    });
    card.removeAttribute('data-mspl-cta-profile');
  }
  function prepare(root) {
    var profile = readProfile(root);
    prepared.set(root, profile);
    if (!profile) return;
    each(root.querySelectorAll('.offer-card[data-mspl-cta-profile]'), undecorate);
  }
  function validHref(value) {
    return typeof value === 'string' && !/[\s<>"'\\]/.test(value) &&
      (/^\/(?!\/)/.test(value) || /^https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#][^\s]*)?$/i.test(value));
  }
  function action(card) {
    var status = card.getAttribute('data-mspl-cta-status');
    var links = card.querySelectorAll('a[data-mspl-role="button"]');
    if ((status !== 'ready' && status !== 'recovered') || links.length !== 1) fail('action-invalid');
    var a = links[0], line = a.parentNode;
    if (line.tagName !== 'P' || line.parentNode !== card || !line.classList.contains('mspl-offer__button') || !validHref(a.getAttribute('href')) || !(a.textContent || '').trim()) fail('action-invalid');
    // Existing formatting is retained, but forms/media/scripts are not an inline
    // text action. The sole SVG exception is our fixed decorative arrow.
    each(a.querySelectorAll('*'), function(n) {
      if (n.closest('[data-mspl-cta-decoration="arrow"]')) return;
      if (!/^(SPAN|STRONG|EM|B|I|U|S|SMALL|SUP|SUB|BR)$/.test(n.tagName)) fail('action-invalid');
    });
    return a;
  }
  function arrow(doc) {
    var panel = doc.createElement('span');
    panel.className = 'mspl-cta-arrow';
    panel.setAttribute('data-mspl-cta-decoration', 'arrow');
    panel.setAttribute('aria-hidden', 'true');
    var ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg'), path = doc.createElementNS(ns, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '24'); svg.setAttribute('height', '24');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    path.setAttribute('d', 'M5 12h14M13 6l6 6-6 6'); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path); panel.appendChild(svg); return panel;
  }
  function finish(root) {
    var profile = readProfile(root), before = prepared.get(root);
    if (!profile && !before) return;
    if (!profile || !before || profile.hash !== before.hash) fail('profile-invalid');
    var cards = Array.prototype.slice.call(root.querySelectorAll('.offer-card'));
    // Validate every action before marking any card as styled.
    var actions = cards.map(action);
    cards.forEach(function(card, index) {
      var a = actions[index];
      if (card.getAttribute('data-mspl-cta-profile') === profile.hash) return;
      var label = root.ownerDocument.createElement('span');
      label.className = 'mspl-cta-label'; label.setAttribute('data-mspl-cta-decoration', 'label');
      while (a.firstChild) label.appendChild(a.firstChild);
      if (profile.buttonKind === 'split-arrow') a.appendChild(arrow(root.ownerDocument));
      a.appendChild(label);
      a.classList.add('mspl-btn');
      card.setAttribute('data-mspl-cta-profile', profile.hash);
      if (card.lastElementChild) card.lastElementChild.style.setProperty('margin-bottom', '0', 'important');
      // Native components often obtain their gaps from wrappers absent in Rich Text.
      // Keep any larger native margin while guaranteeing readable editorial spacing.
      each(card.children, function(n) {
        if (n.tagName !== 'P') return;
        var minimum = n.classList.contains('mspl-offer__button') ? 24 : 16;
        var existing = parseFloat(root.ownerDocument.defaultView.getComputedStyle(n).marginTop) || 0;
        n.style.setProperty('margin-top', Math.max(minimum, existing) + 'px', 'important');
      });
    });
  }
  return {prepare:prepare, finish:finish};
})();
