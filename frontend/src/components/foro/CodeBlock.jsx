import PropTypes from 'prop-types';
import { parseContentWithCode } from '../../utils/codeHighlight';

/**
 * Renderiza un texto que puede contener bloques de código de triple backtick (```lang ... ```)
 * o código inline (`code`). Aplica sintaxis highlighting de highlight.js.
 */
const CodeBlock = ({ content }) => {
  if (!content) return null;

  const segments = parseContentWithCode(content);

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {segments.map((segment, index) => {
        if (segment.type === 'code_block') {
          return (
            <div key={`block-${index}`} className="my-3 rounded-xl overflow-hidden shadow-md border border-slate-700/60 bg-[#1e1e2e]">
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-xs font-mono text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-[11px] text-teal-400">
                  {segment.language}
                </span>
                <span className="text-[10px] text-slate-500">código</span>
              </div>
              <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto text-slate-200">
                <code dangerouslySetInnerHTML={{ __html: segment.highlightedHtml }} />
              </pre>
            </div>
          );
        }

        if (segment.type === 'code_inline') {
          return (
            <code
              key={`inline-${index}`}
              className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200"
            >
              {segment.content}
            </code>
          );
        }

        return (
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {segment.content}
          </span>
        );
      })}
    </div>
  );
};

CodeBlock.propTypes = {
  content: PropTypes.string,
};

export default CodeBlock;
