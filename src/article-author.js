/* Editor-safe author and metadata markers are article content at rest.
 * Move their original DOM nodes into narrowly owned siblings only after full validation.
 * No Webflow template bindings, unrelated author sections or image bytes are changed.
 */
var articleAuthor = (function () {
  'use strict';
  function fail(code) { var error = new Error('Article author: ' + code); error.articleCode = 'author-' + code; throw error; }
  function role(node) { return node && node.getAttribute && node.getAttribute('data-mspl-role') || ''; }
  function text(node) { return (node && node.textContent || '').replace(/\s+/g, ' ').trim(); }
  function one(root, name, tag) {
    var nodes = root.querySelectorAll('[data-mspl-role="' + name + '"]');
    if (nodes.length !== 1 || nodes[0].parentNode !== root || nodes[0].tagName !== tag) fail('invalid-' + name);
    return nodes[0];
  }
  function safeText(node, tags) {
    var descendants = node.querySelectorAll('*');
    for (var i = 0; i < descendants.length; i++) {
      if (tags.indexOf(descendants[i].tagName) === -1 || descendants[i].attributes.length) fail('unsafe-content');
    }
    for (var j = 0; j < node.attributes.length; j++) if (/^on/i.test(node.attributes[j].name)) fail('unsafe-content');
  }
  function stagingSite(siteId) {
    if (!/^[a-f0-9]{24}$/.test(siteId || '') || siteId !== document.documentElement.getAttribute('data-wf-site') || window.location.protocol !== 'https:') return false;
    if (/^[a-z0-9-]+\.webflow\.io$/i.test(window.location.hostname)) return true;
    var canvas = /^([a-z0-9-]+)\.canvas\.webflow\.com$/i.exec(window.location.hostname);
    if (!canvas) return false;
    try { return new URL(document.referrer).origin === 'https://' + canvas[1] + '.design.webflow.com'; } catch (e) { return false; }
  }
  function publicURL(value, sameOrigin, siteId) {
    var url;
    try { url = new URL(value, document.baseURI); } catch (e) { fail('unsafe-url'); }
    if (!/^https:\/\//i.test(value || '') || url.protocol !== 'https:' || url.username || url.password || /(?:^|\.)(?:localhost|local|internal)$/i.test(url.hostname) || /^\d+(?:\.\d+){3}$/.test(url.hostname)) fail('unsafe-url');
    if (sameOrigin && url.origin !== window.location.origin) {
      // Designer/staging can render a canonical production author link. Accept
      // only HTTPS origins explicitly declared by the page's own head metadata.
      var declared = document.head.querySelectorAll('link[rel~="canonical"][href],meta[property="og:url"][content]'), matched = false;
      for (var i = 0; i < declared.length; i++) {
        var value = declared[i].getAttribute(declared[i].tagName === 'LINK' ? 'href' : 'content');
        try { if (new URL(publicURL(value, false)).origin === url.origin) matched = true; } catch (e) { /* An invalid optional declaration grants no origin. */ }
      }
      // The pipeline's verified site marker also supports Webflow staging when
      // the client has no optional canonical metadata. Custom domains still
      // require their own origin; a marker from another site grants nothing.
      if (!matched && !stagingSite(siteId)) fail('profile-origin-mismatch');
    }
    return url.href;
  }
  function sources(root, stash) {
    var headings = root.querySelectorAll('h2[data-mspl-role="sources"]');
    for (var i = 0; i < headings.length; i++) {
      var heading = headings[i], parent = heading.parentNode;
      if (parent.classList.contains('mspl-sources') && parent.parentNode === root) { stash.appendChild(parent); continue; }
      if (parent !== root) continue;
      var node = heading;
      while (node) {
        var next = node.nextSibling;
        stash.appendChild(node);
        if (next && next.nodeType === 1 && (next.tagName === 'H2' || /^author/.test(role(next)))) break;
        node = next;
      }
    }
  }
  function prepare(root) {
    var saved = root.__msplArticleAuthor;
    if (saved) {
      if (saved.card && (saved.card.previousElementSibling !== root || saved.meta.nextElementSibling !== root)) fail('runtime-changed');
      return;
    }
    var markers = root.querySelectorAll('[data-mspl-role="article-meta"],[data-mspl-role^="author"]');
    if (!markers.length) return;
    if (document.querySelector('[data-mspl-article-author="true"],[data-mspl-article-meta="true"]')) fail('conflict');
    var meta = one(root, 'article-meta', 'P'), heading = one(root, 'author', 'H2'), photo = one(root, 'author-photo', 'FIGURE');
    var name = one(root, 'author-name', 'P'), position = root.querySelector('[data-mspl-role="author-position"]'), link = one(root, 'author-link', 'P'), end = root.querySelector('[data-mspl-role="author-end"]');
    if (position) position = one(root, 'author-position', 'P');
    if (end) end = one(root, 'author-end', 'P');
    var bios = Array.prototype.slice.call(root.querySelectorAll('[data-mspl-role="author-bio"]'));
    if (!text(meta) || !text(heading) || !text(name) || text(end) || !bios.length || meta !== root.firstElementChild) fail('incomplete-markers');
    safeText(meta, []); safeText(heading, []); safeText(name, []); if (position) safeText(position, []); if (end) safeText(end, []);
    bios.forEach(function (bio) { if (bio.parentNode !== root || bio.tagName !== 'P' || !text(bio)) fail('invalid-bio'); safeText(bio, ['STRONG', 'B', 'EM', 'I', 'BR']); });
    var sequence = [heading, photo, name].concat(position ? [position] : [], bios, [link], end ? [end] : []);
    if (markers.length !== sequence.length + 1) fail('unexpected-markers');
    for (var s = 0; s < sequence.length - 1; s++) if (sequence[s].nextElementSibling !== sequence[s + 1]) fail('marker-order');
    // An editor can discard an empty paragraph sentinel. The complete verified
    // author sequence must still be terminal; unknown content is never absorbed.
    for (var tail = (end || link).nextSibling; tail; tail = tail.nextSibling) {
      if (tail.nodeType === 3 && text(tail)) fail('author-not-last');
      if (tail.nodeType === 1 && (tail.attributes.length || ['P', 'BR'].indexOf(tail.tagName) === -1 || text(tail) || tail.querySelector(':not(br)'))) fail('author-not-last');
    }
    var image = photo.querySelector('img'), images = photo.querySelectorAll('img'), anchor = link.querySelector('a');
    if (images.length !== 1 || !image || !image.hasAttribute('alt') || !anchor || link.querySelectorAll('a').length !== 1 || text(link) !== text(anchor) || !text(anchor)) fail('invalid-photo-or-link');
    for (var la = 0; la < link.attributes.length; la++) if (/^on/i.test(link.attributes[la].name)) fail('unsafe-link');
    publicURL(image.getAttribute('src'), false); var siteId = link.getAttribute('data-mspl-site-id'), profile = publicURL(anchor.getAttribute('href'), true, siteId);
    var photoNodes = [photo].concat(Array.prototype.slice.call(photo.querySelectorAll('*')));
    photoNodes.forEach(function (node) { if (['FIGURE', 'DIV', 'IMG'].indexOf(node.tagName) === -1) fail('unsafe-photo'); for (var a = 0; a < node.attributes.length; a++) if (/^on/i.test(node.attributes[a].name)) fail('unsafe-photo'); });
    if (anchor.children.length) fail('unsafe-link');
    for (var a = 0; a < anchor.attributes.length; a++) if (/^on/i.test(anchor.attributes[a].name)) fail('unsafe-link');
    // Validation above is deliberately complete before removing any source node.
    var card = document.createElement('aside'), body = document.createElement('div'), bioBox = document.createElement('div');
    card.className = 'mspl-author'; card.setAttribute('data-mspl-article-author', 'true');
    var seed = 'mspl-article-author-title', id = seed, counter = 1;
    while (document.getElementById(id)) id = seed + '-' + counter++;
    heading.id = id; heading.classList.add('mspl-author__kicker'); card.setAttribute('aria-labelledby', id);
    body.className = 'mspl-author__body'; bioBox.className = 'mspl-author__bio';
    photo.classList.add('mspl-author__photo'); image.setAttribute('data-mspl-author-portrait', 'true');
    name.classList.add('mspl-author__name'); if (position) position.classList.add('mspl-author__role'); link.classList.add('mspl-author__links');
    body.appendChild(heading); body.appendChild(name); if (position) body.appendChild(position);
    bios.forEach(function (bio) { bioBox.appendChild(bio); }); body.appendChild(bioBox); body.appendChild(link);
    card.appendChild(photo); card.appendChild(body);
    meta.classList.add('mspl-post-meta'); meta.setAttribute('data-mspl-article-meta', 'true');
    root.parentNode.insertBefore(meta, root); root.parentNode.insertBefore(card, root.nextSibling);
    var stash = document.createDocumentFragment(); if (end) stash.appendChild(end); sources(root, stash);
    // Original marker nodes remain intact in the owned card/metadata; removed sentinels
    // and sources are retained in memory. The saved CMS body remains plain readable markup.
    root.__msplArticleAuthor = {card:card, meta:meta, stash:stash, profile:profile, stagingProfile:stagingSite(siteId) ? window.location.origin + new URL(profile).pathname : null};
  }
  function finish(root) {
    var saved = root.__msplArticleAuthor; if (!saved) return;
    var brand = (saved.meta.getAttribute('data-mspl-brand') || '').trim();
    if (brand) Array.prototype.forEach.call(root.querySelectorAll('.mspl-ig--table'), function(table) {
      if (!table.querySelector('.mspl-ig__footer')) { var credit=document.createElement('div');credit.className='mspl-ig__footer';credit.textContent=brand;table.appendChild(credit); }
    });
    var sample = window.getComputedStyle(root), targets = [saved.card, saved.meta];
    targets.forEach(function (target) {
      target.style.fontFamily = sample.fontFamily; target.style.color = sample.color;
      ['--mspl-accent', '--mspl-rule', '--mspl-radius', '--mspl-button-radius'].forEach(function (key) { var value = sample.getPropertyValue(key); if (value) target.style.setProperty(key, value); });
    });
    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i];
      if (root.contains(anchor) || saved.card.contains(anchor) || (anchor.href !== saved.profile && anchor.href !== saved.stagingProfile) || anchor.closest('nav,footer,[role="navigation"],[role="contentinfo"],.mspl-author')) continue;
      var portraits = anchor.querySelectorAll('img');
      for (var j = 0; j < portraits.length; j++) {
        portraits[j].setAttribute('data-mspl-author-portrait', 'true');
        ['--mspl-accent','--mspl-radius'].forEach(function(key){portraits[j].style.setProperty(key,sample.getPropertyValue(key));});
      }
    }
    sources(root, saved.stash);
  }
  return {prepare:prepare, finish:finish};
}());
