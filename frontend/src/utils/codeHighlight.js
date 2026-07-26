import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Parsea un texto que contiene bloques de código de triple backtick (```lang ... ```)
 * o código inline (`...`), devolviendo una lista de segmentos (texto o código).
 */
export function parseContentWithCode(text) {
  if (!text) return [];

  const segments = [];
  let count = 0;
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      count = parseInlineCode(plainText, segments, count);
    }

    const language = (match[1] || 'plaintext').trim().toLowerCase();
    const rawCode = match[2];

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

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parseInlineCode(remainingText, segments, count);
  }

  return segments;
}

function parseInlineCode(text, segments, initialCount = 0) {
  const inlineRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let count = initialCount;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      count += 1;
      segments.push({
        id: `text-${count}`,
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    count += 1;
    segments.push({
      id: `inline-${count}`,
      type: 'code_inline',
      content: match[1],
    });

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    count += 1;
    segments.push({
      id: `text-${count}`,
      type: 'text',
      content: text.substring(lastIndex),
    });
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
