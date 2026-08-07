import React from 'react';
import { cn } from "@/lib/utils";
import "./styles/CardsBlock.css";

interface CardChild {
  title: string;
  description?: string;
  meta?: string;
  url?: string;
}

interface CardItem {
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  badge?: string;
  meta?: string;
  image?: string;
  icon?: string;
  openInNewTab?: boolean | string;
  children?: CardChild[];
}

interface CardsBlockProps {
  fields: {
    title?: string;
    description?: string;
    layout?: 'grid' | 'list';
    columns?: string | number;
    cards: string | CardItem[];
  };
}

// A responsive grid/list of content cards — title (optional link), category badge,
// description, a meta line (e.g. a date) and optional nested child items. Colours
// inherit the host (currentColor / color-mix) so it adapts to any theme's light+dark.
const CardsBlock: React.FC<CardsBlockProps> = ({ fields }) => {
  const { title, description, layout = 'grid', columns, cards: cardsData = [] } = fields;

  let cards: CardItem[] = [];
  try {
    cards = typeof cardsData === 'string' ? JSON.parse(cardsData) : cardsData;
  } catch (e) {
    console.warn('CardsBlock: failed to parse cards JSON', e);
    cards = [];
  }
  if (!Array.isArray(cards) || cards.length === 0) return null;

  const cols = Number(columns) || 0;
  // Expose the count as a custom property rather than an inline grid-template so
  // the stylesheet can step it down on narrow screens (inline styles can't be
  // overridden by media queries).
  const useCols = layout === 'grid' && cols > 0;
  const gridStyle = useCols ? ({ ['--cards-cols']: String(cols) } as React.CSSProperties) : undefined;

  // An icon is configurable per card. It accepts an image URL, an icon-font class
  // (e.g. "fa fa-code", "bi bi-book") or a plain glyph/emoji — so it works with any
  // host theme without a hard icon-library dependency.
  const renderIcon = (icon?: string) => {
    if (!icon || !icon.trim()) return null;
    const val = icon.trim();
    const isImage = /^(https?:\/\/|\/|\.\.?\/|data:)/.test(val) || /\.(png|jpe?g|gif|svg|webp)$/i.test(val);
    if (isImage) {
      return (
        <div className="cards-block__icon">
          <img src={val} alt="" aria-hidden="true" />
        </div>
      );
    }
    const isIconFont = /\s/.test(val) || /^(fa|fas|far|fab|fal|bi|mdi|ph|icon|material-icons)[- ]/.test(val);
    if (isIconFont) {
      return (
        <div className="cards-block__icon">
          <i className={val} aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="cards-block__icon cards-block__icon--glyph" aria-hidden="true">
        {val}
      </div>
    );
  };

  const renderTitle = (c: CardItem | CardChild) => {
    const newTab = typeof (c as CardItem).openInNewTab === 'string'
      ? (c as CardItem).openInNewTab === 'true'
      : (c as CardItem).openInNewTab;
    return c.url ? (
      <a
        className="cards-block__title-link"
        href={c.url}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {c.title}
      </a>
    ) : (
      <span className="cards-block__title-link">{c.title}</span>
    );
  };

  const renderCard = (c: CardItem, i: number) => (
    <div className="cards-block__card" key={i}>
      {c.image && (
        <div className="cards-block__media">
          <img src={c.image} alt={c.title} />
        </div>
      )}
      <div className="cards-block__body">
        {renderIcon(c.icon)}
        <div className="cards-block__head">
          <div className="cards-block__heading">
            <div className="cards-block__title">{renderTitle(c)}</div>
            {c.subtitle && <div className="cards-block__subtitle">{c.subtitle}</div>}
          </div>
          {c.badge && <span className="cards-block__badge">{c.badge}</span>}
        </div>
        {c.description && <p className="cards-block__desc">{c.description}</p>}
        {c.meta && <div className="cards-block__meta">{c.meta}</div>}
        {Array.isArray(c.children) && c.children.length > 0 && (
          <div className="cards-block__children">
            {c.children.map((ch, j) => (
              <div className="cards-block__child" key={j}>
                <div className="cards-block__child-head">
                  <span className="cards-block__child-title">{renderTitle(ch)}</span>
                  {ch.meta && <span className="cards-block__child-meta">{ch.meta}</span>}
                </div>
                {ch.description && <p className="cards-block__child-desc">{ch.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="cards-block">
      {(title || description) && (
        <div className="cards-block__header">
          {title && <div className="cards-block__section-title">{title}</div>}
          {description && <div className="cards-block__section-desc">{description}</div>}
        </div>
      )}
      <div
        className={cn("cards-block__grid", `cards-block__grid--${layout}`, useCols && "cards-block__grid--cols")}
        style={gridStyle}
      >
        {cards.map(renderCard)}
      </div>
    </div>
  );
};

export default CardsBlock;
