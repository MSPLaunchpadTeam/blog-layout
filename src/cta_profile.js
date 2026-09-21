/* Versioned, identity-bound native CTA style contract. Pure data; no network or DOM. */
var CP=(function(){
 'use strict';
 const VERSION=1,PARTS=['card','heading','body','button','arrow'],SIZES=['desktop','tablet','mobile'];
 const PROPERTIES=new Set(('background-color color font-family font-size font-weight font-style line-height letter-spacing text-transform text-align text-decoration border border-top border-right border-bottom border-left border-color border-width border-style border-radius border-top-left-radius border-top-right-radius border-bottom-left-radius border-bottom-right-radius padding padding-top padding-right padding-bottom padding-left margin-top margin-bottom margin-left margin-right gap row-gap column-gap width min-width max-width height min-height max-height box-shadow align-items justify-content flex-direction').split(' '));
 const fail=m=>{throw Error('CTA profile: '+m);};
 const sha=s=>(typeof OP!=='undefined'?OP:require('./october_preflight.js')).sha256(s);
 const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
 const json=x=>JSON.stringify(canonical(x));
 const COLOURS=new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato transparent turquoise violet wheat white whitesmoke yellow yellowgreen currentcolor').split(' '));
 const number=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
 const length=v=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:px|em|rem|ex|ch|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|pt|pc|in|cm|mm|q|%)$/i.test(v)||number.test(v)&&Number(v)===0;
 const nonnegative=v=>length(v)&&parseFloat(v)>=0;
 const words=v=>v.match(/(?:rgba?|hsla?)\([^)]*\)|[^\s]+/gi)||[];
 function colour(v){
  if(COLOURS.has(v.toLowerCase())||/^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(v))return true;
  const f=/^(rgb|rgba|hsl|hsla)\(([^()]*)\)$/i.exec(v);if(!f||/[,/]\s*[,/]|^[\s,/]*$/.test(f[2]))return false;
  let values;if(f[2].includes(',')){if(f[2].includes('/'))return false;values=f[2].split(',').map(n=>n.trim());}
  else {const groups=f[2].trim().split('/');if(groups.length>2)return false;values=groups[0].trim().split(/\s+/);if(values.length!==3)return false;if(groups.length===2)values.push(groups[1].trim());}
  return [3,4].includes(values.length)&&values.every((n,i)=>/^hsl/i.test(f[1])&&i<3?(i===0?/^[+-]?(?:\d*\.)?\d+(?:deg|rad|grad|turn)?$/i.test(n):/^[+-]?(?:\d*\.)?\d+%$/.test(n)):/^[+-]?(?:\d*\.)?\d+%?$/.test(n));
 }
 const borderStyles=new Set('none hidden dotted dashed solid double groove ridge inset outset'.split(' '));
 function valueAllowed(prop,value){
  const v=value.trim(),parts=words(v),within=(max,predicate)=>parts.length>0&&parts.length<=max&&parts.every(predicate);
  if(prop==='color'||prop==='background-color')return colour(v);
  if(prop==='font-family')return v.split(',').every(n=>/^(?:"[^"\n]+"|'[^'\n]+'|[a-zA-Z_][a-zA-Z0-9_ -]*)$/.test(n.trim()));
  if(prop==='font-size')return nonnegative(v)&&parseFloat(v)>0||/^(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)$/.test(v);
  if(prop==='font-weight')return /^(?:normal|bold|bolder|lighter)$/.test(v)||number.test(v)&&Number(v)>=1&&Number(v)<=1000;
  if(prop==='font-style')return /^(?:normal|italic|oblique(?: [+-]?(?:\d*\.)?\d+deg)?)$/.test(v);
  if(prop==='line-height')return v==='normal'||number.test(v)&&Number(v)>0||nonnegative(v)&&parseFloat(v)>0;
  if(prop==='letter-spacing')return v==='normal'||length(v);
  if(prop==='text-align')return /^(?:left|right|center|start|end|justify|match-parent)$/.test(v);
  if(prop==='text-transform')return /^(?:none|capitalize|uppercase|lowercase|full-width|full-size-kana)$/.test(v);
  if(prop==='text-decoration')return within(5,n=>/^(?:none|underline|overline|line-through|solid|double|dotted|dashed|wavy|auto|from-font)$/.test(n)||colour(n)||nonnegative(n));
  if(prop==='align-items')return /^(?:(?:safe |unsafe )?(?:normal|stretch|center|start|end|flex-start|flex-end|baseline)|(?:first|last) baseline)$/.test(v);
  if(prop==='justify-content')return /^(?:(?:safe |unsafe )?(?:normal|stretch|center|start|end|flex-start|flex-end|left|right)|space-between|space-around|space-evenly)$/.test(v);
  if(prop==='flex-direction')return /^(?:row|row-reverse|column|column-reverse)$/.test(v);
  if(prop==='border-color')return within(4,colour);
  if(prop==='border-style')return within(4,n=>borderStyles.has(n));
  if(prop==='border-width')return within(4,n=>/^(?:thin|medium|thick)$/.test(n)||nonnegative(n));
  if(/^border(?:-(?:top|right|bottom|left))?$/.test(prop)){const widths=parts.filter(n=>nonnegative(n)||/^(?:thin|medium|thick)$/.test(n)),styles=parts.filter(n=>borderStyles.has(n)),colours=parts.filter(colour);return parts.length>0&&parts.length<=3&&widths.length<=1&&styles.length<=1&&colours.length<=1&&widths.length+styles.length+colours.length===parts.length;}
  if(/^border-.*radius$/.test(prop))return v.split('/').length<=2&&v.split('/').every(group=>{const ns=group.trim().split(/\s+/);return ns.length<=4&&ns.every(nonnegative);});
  if(prop==='box-shadow')return v==='none'||v.split(/,(?![^()]*\))/).every(shadow=>{const ns=words(shadow.trim()),dims=ns.filter(length),cs=ns.filter(colour),insets=ns.filter(n=>n==='inset');return dims.length>=2&&dims.length<=4&&cs.length<=1&&insets.length<=1&&dims.length+cs.length+insets.length===ns.length&&(dims.length<3||parseFloat(dims[2])>=0);});
  if(/^margin-/.test(prop))return v==='auto'||length(v);
  if(/^padding(?:-|$)/.test(prop))return within(prop==='padding'?4:1,nonnegative);
  if(/^(?:row-|column-)?gap$/.test(prop))return within(prop==='gap'?2:1,n=>n==='normal'||nonnegative(n));
  if(/^(?:min-|max-)?(?:width|height)$/.test(prop))return /^(?:min-content|max-content|fit-content|stretch)$/.test(v)||(prop.startsWith('max-')?v==='none':v==='auto')||nonnegative(v);
  return false;
 }
 function data(p){return Object.fromEntries(Object.entries(p).filter(([k])=>k!=='hash'));}
 function shape(p,id){
  if(!p||p.version!==VERSION)fail('unsupported or missing version');
  if(!/^rec[a-zA-Z0-9]+$/.test(p.clientId||'')||!/^[a-f0-9]{24}$/i.test(p.siteId||''))fail('client/site identity required');
  if(id&&(p.clientId!==(id.clientId||id.id)||p.siteId!==id.siteId))fail('client/site identity mismatch');
  if(!/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s<>"'\\]*)?$/i.test(p.referenceUrl||'')||/https:\/\/(?:\d+\.|localhost\.)/i.test(p.referenceUrl))fail('public reference URL required');
  if(!['service','about'].includes(p.referenceKind))fail('reference kind must be service or about');
  for(const k of ['htmlSha256','cssSha256'])if(!/^[a-f0-9]{64}$/.test(p[k]||''))fail('source '+k+' fingerprint required');
  if(!['plain','split-arrow'].includes(p.buttonKind))fail('unsupported button structure requires review');
  const allowed=new Set(['version','clientId','siteId','referenceUrl','referenceKind','htmlSha256','cssSha256','buttonKind','tokens','hash']);
  if(Object.keys(p).some(k=>!allowed.has(k)))fail('unsupported profile field');
  if(!p.tokens||Object.keys(p.tokens).some(k=>!SIZES.includes(k)))fail('responsive tokens required');
  for(const size of SIZES){
   const tokens=p.tokens[size];if(!tokens||Object.keys(tokens).some(k=>![...PARTS,'label'].includes(k)))fail('missing or unsupported '+size+' tokens');
   for(const part of [...PARTS,...(Object.hasOwn(tokens,'label')?['label']:[])]){const values=tokens[part];if(!values||Array.isArray(values)||typeof values!=='object')fail(size+' '+part+' tokens required');
    for(const [prop,value] of Object.entries(values)){
     if(!PROPERTIES.has(prop))fail('unsupported CSS property '+prop);
     if(typeof value!=='string'||!value.trim()||value.length>240||/[;{}<>\\!@\u0000-\u001f]/.test(value)||/(?:url|expression|var|attr)\s*\(/i.test(value)||/inherit|revert|unset/i.test(value))fail('unsafe or unresolved CSS '+prop);
     if(!/^[a-zA-Z0-9 #.,%()'"+\/-]+$/.test(value))fail('unsupported CSS value '+prop);
     if(!valueAllowed(prop,value))fail('invalid or unsupported concrete CSS value '+prop);
    }
   }
   const typography=['color','font-family','font-size','font-weight','line-height'];
   for(const [part,props] of [['card',['background-color','color','text-align']],['heading',typography],['body',typography],['button',['background-color',...typography]]])for(const prop of props)if(!tokens[part][prop])fail('missing '+size+' '+part+' '+prop);
   if(!['left','center','right','start','end'].includes(tokens.card['text-align']))fail('unsupported alignment');
   if(p.buttonKind==='split-arrow'&&(!tokens.arrow['background-color']||!tokens.arrow.color||!tokens.arrow.width))fail('split-arrow appearance missing');
  }
  return p;
 }
 function create(input){const p=canonical(data(input));shape(p);p.hash=sha(json(p));return p;}
 function validate(p,id){shape(p,id);if(!/^[a-f0-9]{64}$/.test(p.hash||'')||sha(json(data(p)))!==p.hash)fail('profile hash mismatch');return p;}
 const declarations=o=>Object.entries(o).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+':'+v+' !important;').join('');
 function css(p){
  validate(p);const root='html[data-wf-site="'+p.siteId+'"] .offer-card[data-mspl-cta-profile="'+p.hash+'"]';
  const rule=(s,o)=>s+'{'+declarations(o)+'}';
  function articleArrow(tokens){
   if(p.buttonKind!=='split-arrow')return tokens;
   const out={...tokens,height:'auto','max-height':'none'};
   // Native buttons often specify a one-line height. In an article the action
   // label is editable, so that height becomes a minimum and the panel stretches.
   if(tokens.height&&tokens.height!=='auto')out['min-height']=tokens['min-height']&&tokens['min-height']!=='auto'&&tokens['min-height']!==tokens.height?'max('+tokens['min-height']+','+tokens.height+')':tokens.height;
   return out;
  }
  function headingFit(tokens){
   const heading=root+' :is(h2,h3,h4)';
   return '@media(max-width:359px){'+rule(heading,{'font-size':'min('+tokens['font-size']+',1.8rem)'})+'}\n'+
    '@supports(font-size:1cqw){'+rule(heading,{'font-size':'min('+tokens['font-size']+',12cqw)'})+'}\n'+
    rule(heading+' *',{'font-size':'inherit'});
  }
  function buttonAlignment(card){
   const direction=card['flex-direction'];
   const axis=direction&&direction.startsWith('column')?card['align-items']:direction&&direction.startsWith('row')?card['justify-content']:null;
   const align=String(axis||'').replace(/^(safe|unsafe) /,'');
   if(align==='center')return 'center';
   if(align==='left'||align==='right')return align;
   if(['start','flex-start','end','flex-end'].includes(align)){
    const end=align.endsWith('end'),reverse=direction==='row-reverse'&&align.startsWith('flex-');
    return end!==reverse?'right':'left';
   }
   return card['text-align'];
  }
  function layer(size){const t=p.tokens[size];return [
   rule(root,t.card),rule(root+' :is(.mspl-offer__button,.mspl-btn-line)',{'text-align':buttonAlignment(t.card)}),rule(root+' :is(h2,h3,h4)',t.heading),rule(root+' > p:not(.mspl-offer__button):not(.mspl-btn-line)',t.body),
   rule(root+' a.mspl-btn',t.button),rule(root+' .mspl-cta-arrow',articleArrow(t.arrow)),...(t.label?[rule(root+' .mspl-cta-label',{padding:'0',...t.label})]:[]),
   rule(root+' :is(h2,h3,h4) *',Object.fromEntries(Object.entries(t.heading).filter(([k])=>/^(color|font-|line-height|letter-spacing|text-)/.test(k)))),
   rule(root+' > p:not(.mspl-offer__button):not(.mspl-btn-line) *',Object.fromEntries(Object.entries(t.body).filter(([k])=>/^(color|font-family|font-size|line-height|letter-spacing|text-)/.test(k)))),headingFit(t.heading)
  ].join('\n');}
  return [
   root+'{box-sizing:border-box!important;width:100%!important;max-width:100%!important;border:0!important;container-type:inline-size!important;overflow-wrap:anywhere!important;}',
   root+' a.mspl-btn{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;max-width:100%!important;min-width:0!important;border:0!important;white-space:normal!important;text-decoration:none!important;overflow:hidden!important;'+(p.buttonKind==='split-arrow'?'padding:0!important;gap:0!important;':'')+'}',
   root+' .mspl-cta-label{display:block!important;position:static!important;min-width:0!important;margin:0!important;padding:'+(p.buttonKind==='split-arrow'?'12px 24px':'0')+'!important;color:inherit!important;font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;background:transparent!important;white-space:normal!important;overflow-wrap:anywhere!important;}',
   root+' .mspl-cta-label *{display:inline!important;position:static!important;margin:0!important;padding:0!important;border:0!important;min-width:0!important;max-width:none!important;width:auto!important;min-height:0!important;max-height:none!important;height:auto!important;transform:none!important;float:none!important;white-space:inherit!important;color:inherit!important;font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;background:transparent!important;}',
   root+' .mspl-cta-arrow{display:flex!important;align-self:stretch!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;min-height:0!important;max-width:100%!important;}',
   root+' .mspl-cta-arrow svg{display:block!important;width:24px!important;height:24px!important;fill:currentColor!important;}',
   root+' a.mspl-btn:focus-visible{outline:3px solid currentColor!important;outline-offset:4px!important;}',
   layer('desktop'),'@media(max-width:991px){'+layer('tablet')+'}','@media(max-width:767px){'+layer('mobile')+'}'
  ].join('\n');
 }
 function markup(p,id){validate(p,id);return '<script id="mspl-cta-profile" type="application/json">'+json(p).replace(/</g,'\\u003c')+'</script>\n<style data-mspl-cta-style="'+p.hash+'">'+css(p)+'</style>';}
 function verify(html,p,id){
  validate(p,id);if(typeof html!=='string')fail('installation HTML required');
  for(const block of html.matchAll(/<!--[^]*?-->|<(template|noscript|textarea|xmp|iframe)\b[^>]*>[^]*?<\/\1\s*>/gi))if(/mspl-cta-(?:profile|style)/i.test(block[0]))fail('CTA profile/style is in an inert context');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(m=>/\bid\s*=\s*["']mspl-cta-profile["']/i.test(m[1]));
  const styles=[...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi)].filter(m=>/\bdata-mspl-cta-style\s*=/i.test(m[1]));
  if(scripts.length!==1||styles.length!==1)fail('exactly one CTA profile and stylesheet required');
  function attributes(text){const seen=new Set(),out={};for(const m of text.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)){const key=m[1].toLowerCase();if(seen.has(key))fail('duplicate profile/style attribute');seen.add(key);out[key]=m[2]??m[3]??m[4]??'';}return out;}
  const scriptAttrs=attributes(scripts[0][1]),styleAttrs=attributes(styles[0][1]);
  if(Object.keys(scriptAttrs).some(k=>!['id','type','nonce'].includes(k)))fail('unsupported profile script attribute');
  if(Object.keys(styleAttrs).some(k=>!['data-mspl-cta-style','type','media','nonce'].includes(k))||(styleAttrs.type&&styleAttrs.type.toLowerCase()!=='text/css')||(styleAttrs.media&&!['all','screen'].includes(styleAttrs.media.toLowerCase().trim())))fail('CTA stylesheet must be active on every supported viewport');
  if(!/\btype\s*=\s*["']application\/json["']/i.test(scripts[0][1]))fail('profile JSON type mismatch');
  let parsed;try{parsed=JSON.parse(scripts[0][2]);}catch{fail('invalid profile JSON');}validate(parsed,id);
  if(json(parsed)!==json(p)||!new RegExp('data-mspl-cta-style=["\']'+p.hash+'["\']').test(styles[0][1])||styles[0][2]!==css(p))fail('profile/style exact readback mismatch');return true;
 }
 function select(refs,id){
  if(!Array.isArray(refs)||!refs.length)fail('missing CTA references; inspect service/About Us pages');refs.forEach(p=>validate(p,id));
  const services=refs.filter(p=>p.referenceKind==='service'),candidates=services.length?services:refs.filter(p=>p.referenceKind==='about');
  if(!candidates.length)fail('missing supported CTA reference');
  const appearances=new Set(candidates.map(p=>json({buttonKind:p.buttonKind,tokens:p.tokens})));if(appearances.size!==1)fail('conflicting '+(services.length?'service':'about')+' CTA styles require review');
  return [...candidates].sort((a,b)=>a.referenceUrl.localeCompare(b.referenceUrl))[0];
 }
 return {VERSION,create,validate,markup,verify,css,select,PROPERTIES:[...PROPERTIES]};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CP;
