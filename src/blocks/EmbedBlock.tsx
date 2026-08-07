import React from 'react';
import "./styles/EmbedBlock.css";

interface EmbedBlockProps {
  fields: {
    url?: string;
    title?: string;
    description?: string;
    height?: string;
    aspectRatio?: string;
    allowFullscreen?: boolean | string;
    showToolbar?: boolean | string;
    scrolling?: boolean | string;
  };
}

const isTrue = (v: boolean | string | undefined, dflt = true) =>
  v === undefined || v === '' ? dflt : typeof v === 'string' ? v !== 'false' : !!v;

// Embeds an external page in a framed, expandable viewport. Third-party docs and
// demos are usually too tall for an article column, so the frame gets a fixed
// readable height plus an "Expand" control that promotes it to a full-screen
// overlay (handled by the PRSS client script — SSR output is not hydrated).
const EmbedBlock: React.FC<EmbedBlockProps> = ({ fields }) => {
  const { url, title, description, height, aspectRatio } = fields;
  if (!url || !url.trim()) return null;

  const allowFullscreen = isTrue(fields.allowFullscreen);
  const showToolbar = isTrue(fields.showToolbar);
  const scrolling = isTrue(fields.scrolling);

  // A height wins over an aspect ratio; falling back to 16/9 keeps it responsive.
  const ratio = (aspectRatio || '').trim();
  const frameStyle: React.CSSProperties = height && height.trim()
    ? { height: /^\d+$/.test(height.trim()) ? `${height.trim()}px` : height.trim() }
    : { aspectRatio: ratio || '16 / 9' };

  return (
    <div className="embed-block" data-embed-block>
      {showToolbar && (
        <div className="embed-block__toolbar">
          <div className="embed-block__meta">
            {title && <span className="embed-block__title">{title}</span>}
            {description && <span className="embed-block__desc">{description}</span>}
          </div>
          <div className="embed-block__actions">
            {allowFullscreen && (
              <button type="button" className="embed-block__btn" data-embed-expand aria-label="Expand embed">
                <span aria-hidden="true">⤢</span> Expand
              </button>
            )}
            <a
              className="embed-block__btn"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open embed in a new tab"
            >
              Open ↗
            </a>
          </div>
        </div>
      )}
      <div className="embed-block__frame" style={frameStyle}>
        <iframe
          src={url}
          title={title || 'Embedded content'}
          loading="lazy"
          scrolling={scrolling ? 'yes' : 'no'}
          allowFullScreen={allowFullscreen}
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default EmbedBlock;
