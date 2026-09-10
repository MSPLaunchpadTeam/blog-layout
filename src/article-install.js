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
  try {
    modules.tokens(root);
    modules.faq(root);
    modules.layout(root);
  } catch(error) {
    state.partial=true;
    report('error','initialization-failed');
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
