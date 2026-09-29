/* Pure accent resolution shared by the managed runtime and offline tests. */
var MSPL_ACCENT = (function () {
  'use strict';
  // WCAG 1.4.11 non-text contrast; numerals are ordinal marks. 4.5 would
  // change readable Allied red (#e33b40, 4.0:1); Axios cream was only 1.09:1.
  var ACCENT_MIN_CONTRAST = 3;
  function parseColour(value) {
    if (value && typeof value === 'object' && 'r' in value) return value;
    var s = String(value || '').trim().toLowerCase(), m, h;
    if (s === 'transparent') return {r:0,g:0,b:0,a:0};
    if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/.test(s)) {
      h = s.slice(1); if (h.length < 5) h = h.split('').map(function(c){return c+c;}).join('');
      return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:h.length===8?parseInt(h.slice(6),16)/255:1};
    }
    m = /^rgba?\(([^()]*)\)$/.exec(s); if (!m) return null;
    var p = m[1].trim().split(/[\s,/]+/);
    if ((p.length !== 3 && p.length !== 4) || p.some(function(n){return !/^[+-]?(?:\d*\.)?\d+%?$/.test(n);})) return null;
    function channel(n, max) { return Math.max(0,Math.min(max,parseFloat(n)*(n.endsWith('%')?max/100:1))); }
    return {r:channel(p[0],255),g:channel(p[1],255),b:channel(p[2],255),a:p[3]===undefined?1:channel(p[3],1)};
  }
  function over(c, bg) { return {r:c.r*c.a+bg.r*(1-c.a),g:c.g*c.a+bg.g*(1-c.a),b:c.b*c.a+bg.b*(1-c.a),a:1}; }
  function luminance(value) {
    var c = parseColour(value); if (!c) return NaN;
    var rgb = [c.r,c.g,c.b].map(function(n){n/=255;return n<=0.04045?n/12.92:Math.pow((n+0.055)/1.055,2.4);});
    return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
  }
  function contrast(ink, surface) {
    var a=parseColour(ink),b=parseColour(surface);if(!a||!b)return NaN;
    var x=luminance(over(a,b)),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
  }
  function resolveAccent(input) {
    var candidate=parseColour(input.candidate),surface=parseColour(input.surface);
    var result={mode:'as-is',ink:input.candidate,fill:input.candidate,ratio:null,source:'as-is'};
    if(!surface){result.source='surface-unknown';return result;}
    if(!candidate)return result;
    result.ratio=contrast(candidate,surface);if(result.ratio>=ACCENT_MIN_CONTRAST)return result;
    var fill=over(candidate,surface);
    for(var i=0;i<2;i++){
      var key=i?'text':'heading',ink=parseColour(input[key]);if(!ink)continue;
      var ratio=Math.min(contrast(ink,surface),contrast(ink,fill));
      if(ratio>=ACCENT_MIN_CONTRAST)return {mode:'fill',ink:input[key],fill:input.candidate,ratio:ratio,source:key+'-ink'};
    }
    result.source='ink-unresolved';return result;
  }
  return {ACCENT_MIN_CONTRAST:ACCENT_MIN_CONTRAST,parseColour:parseColour,luminance:luminance,contrast:contrast,resolveAccent:resolveAccent};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=MSPL_ACCENT;
