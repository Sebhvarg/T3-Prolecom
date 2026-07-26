import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Parsea un texto que contiene bloques de código de triple backtick (```lang ... ```)
 * o código inline (`...`), devolviendo una lista de segmentos (texto o código).
 *
 * Estructura del objeto retornado en el array:
 * - segment.type: 'text' | 'code_block' | 'code_inline'
 * - segment.content: string
 * - segment.language: string (opcional)
 * - segment.highlightedHtml: string (opcional, cuando type === 'code_block')
 */
export function parseContentWithCode(text) {
  if (!text) return [];

  const segments = [];
  // Regex para detectar bloques de código ```lang \n content ```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Si hay texto antes del bloque de código
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      parseInlineCode(plainText, segments);
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

    segments.push({
      type: 'code_block',
      language: language || 'code',
      content: rawCode,
      highlightedHtml,
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Texto restante después del último bloque de código
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parseInlineCode(remainingText, segments);
  }

  return segments;
}

function parseInlineCode(text, segments) {
  const inlineRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    segments.push({
      type: 'code_inline',
      content: match[1],
    });

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
