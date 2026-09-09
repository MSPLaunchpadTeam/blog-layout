/* tokens.js - owned class-token compatibility for the sandbox blog template.
   Runs before FAQ and layout. Mirrors Refokus's paired class syntax and element
   scope, including nested button/icon spans, without replacing existing elements.
   ID/attribute tokens and malformed/cross-element pairs stay literal. The release
   audit checks unsupported markers; no Webflow or IX2 reset is needed. */
(function () {
  'use strict';
  var TAGS = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption';
  var PAIR = /\[\.([\w-]+)\](.*?)\[\.\1\]/m;

  function convert(parent) {
    // Only whole sibling elements may move: never split/recreate a link or handler.
    var children = Array.prototype.slice.call(parent.children);
    for (var i = 0; i < children.length; i++) {
      if (!/^(SCRIPT|STYLE|TEXTAREA)$/.test(children[i].tagName)) convert(children[i]);
    }
    while (true) {
      var text = '', nodes = [], child = parent.firstChild;
      while (child) {
        if (child.nodeType === 3) {
          nodes.push({ node: child, start: text.length, end: text.length + child.length });
          text += child.data;
        } else {
          // Refokus's dot does not span newlines, including newlines in markup.
          text += /[\r\n\u2028\u2029]/.test(child.outerHTML || child.nodeValue || '') ? '\n' : '\ufffc';
        }
        child = child.nextSibling;
      }
      var match = PAIR.exec(text);
      if (!match) return;
      var markerLength = match[1].length + 3;
      var first = match.index, last = match.index + match[0].length - markerLength;
      var opening = null, closing = null;
      for (var n = 0; n < nodes.length; n++) {
        if (first >= nodes[n].start && first + markerLength <= nodes[n].end) opening = nodes[n];
        if (last >= nodes[n].start && last + markerLength <= nodes[n].end) closing = nodes[n];
      }
      // A marker split across text nodes is not literal Refokus syntax.
      if (!opening || !closing) return;
      var range = parent.ownerDocument.createRange();
      range.setStart(opening.node, first - opening.start + markerLength);
      range.setEnd(closing.node, last - closing.start);
      var span = parent.ownerDocument.createElement('span');
      span.className = match[1];
      range.surroundContents(span);
      // Delimiters remain in adjacent text nodes; remove exactly those characters.
      span.previousSibling.deleteData(span.previousSibling.length - markerLength, markerLength);
      span.nextSibling.deleteData(0, markerLength);
      convert(span);
    }
  }

  function init() {
    var roots = document.querySelectorAll('.w-richtext');
    for (var i = 0; i < roots.length; i++) {
      var elements = roots[i].querySelectorAll(TAGS);
      for (var j = 0; j < elements.length; j++) {
        if (elements[j].textContent.indexOf('[.') !== -1) convert(elements[j]);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
