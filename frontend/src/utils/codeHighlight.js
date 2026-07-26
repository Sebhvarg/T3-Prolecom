import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Parsea un texto que contiene bloques de código de triple backtick (```lang ... ```)
 * o código inline (`...`), devolviendo una lista de segmentos (texto o código).
 */
export function parseContentWithCode(text) {
  if (!text) return [];

  const parts = text.split('```');
  if (parts.length === 1) {
    const segments = [];
    parseInlineCode(text, segments, 0);
    return segments;
  }

  const segments = [];
  let count = 0;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (i % 2 === 0) {
      // Texto normal (fuera de bloques de código)
      if (part) {
        count = parseInlineCode(part, segments, count);
      }
    } else {
      // Bloque de código triple backtick
      let language = 'plaintext';
      let rawCode = part;

      const firstNewline = part.indexOf('\n');
      if (firstNewline !== -1) {
        const posibleLang = part.substring(0, firstNewline).trim().toLowerCase();
        if (posibleLang && /^[a-zA-Z0-9_-]+$/.test(posibleLang)) {
          language = posibleLang;
          rawCode = part.substring(firstNewline + 1);
        }
      }

      let highlightedHtml;
      try {
        if (language && hljs.getLanguage(language)) {
          highlightedHtml = hljs.highlight(rawCode, { language }).value;
        } else {
          highlightedHtml = hljs.highlightAuto(rawCode).value;
        }
      } catch {
        highlightedHtml = escapeHtml(rawCode);
      }

      count += 1;
      segments.push({
        id: `block-${count}`,
        type: 'code_block',
        language: language || 'code',
        content: rawCode,
        highlightedHtml,
      });
    }
  }

  return segments;
}

function parseInlineCode(text, segments, initialCount = 0) {
  const parts = text.split('`');
  let count = initialCount;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;

    count += 1;
    if (i % 2 === 0) {
      segments.push({
        id: `text-${count}`,
        type: 'text',
        content: part,
      });
    } else {
      segments.push({
        id: `inline-${count}`,
        type: 'code_inline',
        content: part,
      });
    }
  }

  return count;
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
