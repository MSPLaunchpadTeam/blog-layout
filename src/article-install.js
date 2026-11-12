// Bundled after private managed token/FAQ/layout adapters; no global legacy configuration.
var VERSION = '__ARTICLE_VERSION__';
var ownScript = document.currentScript || document.getElementById('mspl-blog-article-runtime');
var scriptURL = ownScript && ownScript.src || '';
if(window.__MSPL_BLOG_ARTICLE_LOAD && window.__MSPL_BLOG_ARTICLE_LOAD.canceled) return;
var prior = window.MSPL_BLOG_ARTICLE;
if (prior) {
  if (prior.version !== VERSION || prior.assets && prior.assets.js !== scriptURL) report('error', 'release-conflict');
  return;
}
var cssURL, css, timer, root;
// Alcott Enterprises 2026-11-12 (first ILM article): the course template gives the Rich Text wrapper a heading
// size (.rich-text-style{font-size:40px}) while paragraphs set their own 18px, so every em in the managed CSS
// resolved against 40px (40px table numerals and row padding, 56-60px block margins). Fleet read the same day,
// 36 installed sites at 1440 and 390 wide: a healthy wrapper is at most 1.29x its paragraph (18px over 14px on
// phones), a broken one at least 2.0x (40px over 20px). Under this ratio the wrapper is prose-sized and the
// components keep inheriting it, so sites that were approved as they are do not move.
var WRAPPER_NOT_PROSE_RATIO = 1.5;
var state = {status:'loading', code:'waiting-dom', version:VERSION, siteId:'', rootSelector:'[data-mspl-article="true"]', assets:{js:scriptURL, css:'', cssLoaded:false}};
function report(status, code) {
  var value = state || {version:VERSION, siteId:document.documentElement.getAttribute('data-wf-site') || '', assets:{js:scriptURL}};
  value.status=status; value.code=code;
  window.MSPL_BLOG_ARTICLE=value;
  document.documentElement.setAttribute('data-mspl-article-status',code);
  window.dispatchEvent(new CustomEvent('mspl:article-status',{detail:value}));
  if(status==='error') console.error('MSPL article setup: '+code+'. Check the universal article installation guide.');
}
function conflict() {
  return !!(window.MSPL_LAYOUT || document.querySelector('[id="mspl-blog-layout-config"], script[src*="/blog-layout.js"], link[href*="/blog-layout.css"], [data-mspl-layout="3"]:not([data-mspl-article-active="true"])'));
}
function selectRoot() {
  var marked=document.querySelectorAll('[data-mspl-article]');
  if(!marked.length) return 'article-missing';
  for(var i=0;i<marked.length;i++) if(marked[i].getAttribute('data-mspl-article')!=='true') return 'article-attribute-invalid';
  if(marked.length!==1) return 'article-ambiguous';
  if(!marked[0].classList.contains('w-richtext')) return 'article-not-rich-text';
  if(marked[0].closest('header,nav,footer,.mspl-author,[data-mspl-author],[role="banner"],[role="navigation"],[role="contentinfo"]')) return 'article-forbidden';
  root=marked[0];
  return '';
}
function fail(code) {
  window.clearTimeout(timer);
  if(css) css.remove();
  report('error',code);
}
// Managed components size themselves in em. They follow the article's own paragraph, never a heading-sized wrapper,
// and in a flex-column wrapper (where margins add up instead of collapsing) they give half their designed margin.
// Without a usable sample paragraph nothing is written: the components keep the inheritance they had before.
function componentBase(sample) {
  var queued=false;
  function clear() {
    root.style.removeProperty('--mspl-component-size');
    root.removeAttribute('data-mspl-base');
    root.removeAttribute('data-mspl-flow');
  }
  function refresh() {
    queued=false;
    try {
      var own=window.getComputedStyle(root), wrapper=parseFloat(own.fontSize);
      var size=sample&&sample.isConnected?window.getComputedStyle(sample).fontSize:'', body=parseFloat(size);
      if(!isFinite(wrapper)||!isFinite(body)||body<=0) return clear();
      if(wrapper>=body*WRAPPER_NOT_PROSE_RATIO) {
        root.style.setProperty('--mspl-component-size',size);
        root.setAttribute('data-mspl-base','paragraph');
      } else {
        root.style.removeProperty('--mspl-component-size');
        root.removeAttribute('data-mspl-base');
      }
      if(/^(inline-)?flex$/.test(own.display)&&/^column/.test(own.flexDirection)) root.setAttribute('data-mspl-flow','stacked');
      else root.removeAttribute('data-mspl-flow');
    } catch(error) { clear(); }
  }
  function schedule() { if(!queued) { queued=true; window.requestAnimationFrame(refresh); } }
  try {
    refresh();
    // The paragraph size is breakpoint-dependent (18px, 16px at 767px and below on the course template).
    window.addEventListener('resize',schedule);
    window.addEventListener('load',schedule);
    if(window.ResizeObserver) new window.ResizeObserver(schedule).observe(root);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(schedule);
  } catch(error) { clear(); }
}
function ready() {
  if(state.status!=='loading') return;
  if(window.MSPL_BLOG_ARTICLE!==state) return fail('release-conflict');
  window.clearTimeout(timer);
  // Recheck after asynchronous CSS loading; Designer content or another installation may have appeared.
  if(conflict()) return fail('legacy-conflict');
  var previous=root, problem=selectRoot();
  if(problem || root!==previous) return fail(problem || 'article-changed');
  if(document.documentElement.getAttribute('data-wf-site')!==state.siteId) return fail('site-changed');
  state.assets.cssLoaded=true;
  root.setAttribute('data-mspl-article-active','true');
  // Carmichael apple-business-manager 2026-10-07: the managed CSS puts contain:inline-size on the active root so
  // shrink-to-fit host wrappers stop sizing the column from the article's min-content (163px there, after which
  // Chromium never repainted the card). Hosts that size the Rich Text FROM its content (auto-width flex items:
  // Zhero, Red Team) collapse to 0 under containment, so measure once with containment active and release it
  // inline when the root collapsed. Never force a layout before containment is active: that froze Carmichael.
  var hostWidth=root.parentElement?root.parentElement.getBoundingClientRect().width:0;
  var rootWidth=root.getBoundingClientRect().width;
  var collapsed=rootWidth<200||(hostWidth>0&&rootWidth<hostWidth*0.4);
  if(collapsed)root.style.contain='none';
  root.setAttribute('data-mspl-contain',collapsed?'released':'inline-size');
  try {
    // Generated labels should inherit native article prose, not an unrelated
    // template wrapper font. Keep native headings and CTA profile rules intact.
    var bodySample=Array.prototype.find.call(root.children,function(node){
      return node.tagName==='P' && node.textContent.trim() &&
        !node.hasAttribute('data-mspl-role') && !node.querySelector('[data-mspl-role="button"]');
    });
    if(bodySample){
      var bodyFont=window.getComputedStyle(bodySample).fontFamily;
      if(bodyFont)root.style.setProperty('--mspl-body-font',bodyFont);
    }
    componentBase(bodySample);
    articleCta.prepare(root);
    articleAuthor.prepare(root);
    modules.tokens(root);
    modules.faq(root);
    modules.layout(root);
    articleCta.finish(root);
    articleAuthor.finish(root);
  } catch(error) {
    state.partial=true;
    report('error',error.articleCode || 'initialization-failed');
    return;
  }
  report('ready','article-ready');
}
function init() {
  if(state.status==='error') return;
  state.siteId=document.documentElement.getAttribute('data-wf-site')||'';
  if(!state.siteId) return report('error','site-missing');
  if(!/^[a-f0-9]{24}$/.test(state.siteId)) return report('error','site-invalid');
  if(conflict()) return report('error','legacy-conflict');
  var problem=selectRoot(); if(problem) return report('error',problem);
  try {
    var url=new URL(scriptURL,document.baseURI);
    if(!/^https?:$/.test(url.protocol) || !/@[a-f0-9]{40}\/blog-article\.js$/.test(url.pathname) || url.search || url.hash) throw new Error('Unpinned script');
    cssURL=new URL('blog-article.css',url).href;
  } catch(e) {return report('error','asset-url-invalid');}
  if(document.querySelector('link[data-mspl-article-css]')) return report('error','css-conflict');
  state.assets.css=cssURL;
  css=document.createElement('link');css.rel='stylesheet';css.href=cssURL;css.setAttribute('data-mspl-article-css',VERSION);
  css.integrity='__ARTICLE_CSS_INTEGRITY__';css.crossOrigin='anonymous';state.assets.cssIntegrity=css.integrity;
  css.onload=ready;css.onerror=function(){if(state.status==='loading')fail('css-load-failed');};
  report('loading','waiting-css');
  timer=window.setTimeout(function(){if(state.status==='loading')fail('css-timeout');},15000);
  document.head.appendChild(css);
}
report('loading','waiting-dom');
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
