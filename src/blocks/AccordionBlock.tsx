import React from 'react';
import './styles/AccordionBlock.css';

interface AccordionBlockProps {
  fields: {
    title?: string;
    allowMultiple?: string;
    firstItemOpen?: string;
    variant?: string;
    size?: string;
    iconPosition?: string;
    items?: string; // JSON string of accordion items
  };
}

const AccordionBlock: React.FC<AccordionBlockProps> = ({ fields }) => {
  const {
    title = 'Frequently Asked Questions',
    allowMultiple = 'false',
    firstItemOpen = 'false',
    variant = 'default',
    size = 'md',
    iconPosition = 'right',
    items = '[]'
  } = fields;

  // Parse items from JSON string
  let accordionItems = [];
  try {
    accordionItems = JSON.parse(items);
  } catch (error) {
    console.error('Error parsing accordion items:', error);
    accordionItems = [];
  }

  // Ensure we have an array and filter out empty items
  if (!Array.isArray(accordionItems)) {
    accordionItems = [];
  }
  
  const validItems = accordionItems.filter(item => 
    item && item.title && item.title.trim() !== ''
  );

  if (validItems.length === 0) {
    return (
      <div className="accordion-placeholder text-center py-8 border-2 border-dashed rounded-lg">
        <div className="text-lg font-medium mb-2">📋 Accordion Block</div>
        <div className="text-sm">Configure accordion items in the block editor to display content here.</div>
      </div>
    );
  }

  const variantClasses = {
    default: 'border-b last:border-b-0',
    bordered: 'border rounded-lg mb-2 last:mb-0',
    filled: 'rounded-lg mb-2 last:mb-0'
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const triggerPadding = {
    sm: 'py-3 px-4',
    md: 'py-4 px-6',
    lg: 'py-5 px-8'
  };

  const contentPadding = {
    sm: 'px-4 pb-3',
    md: 'px-6 pb-4',
    lg: 'px-8 pb-5'
  };

  return (
    <div 
      data-slot="accordion" 
      className={`accordion-block accordion-variant-${variant} accordion-size-${size} ${sizeClasses[size as keyof typeof sizeClasses]}`}
    >
      {title && (
        <div className="accordion-header mb-6">
          <h3 className="accordion-block-title text-2xl font-semibold">
            {title}
          </h3>
        </div>
      )}
      
      <div 
        className="accordion-items space-y-0"
        data-allow-multiple={allowMultiple}
        data-first-item-open={firstItemOpen}
        data-icon-position={iconPosition}
      >
        {validItems.map((item, index) => {
          const isFirstItem = index === 0;
          const shouldBeActive = isFirstItem && firstItemOpen === 'true';
          
          return (
            <div 
              key={index} 
              data-slot="accordion-item" 
              className={`accordion-item ${variantClasses[variant as keyof typeof variantClasses]} ${shouldBeActive ? 'active' : ''}`}
            >
              <button 
                type="button"
                data-slot="accordion-trigger"
                data-accordion-trigger
                className={`accordion-trigger w-full ${triggerPadding[size as keyof typeof triggerPadding]} text-left flex items-center justify-between hover:bg-opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset ${variant === 'filled' ? 'bg-opacity-50' : ''}`}
                aria-expanded={shouldBeActive ? "true" : "false"}
                aria-controls={`accordion-content-${index}`}
              >
              <span className={`accordion-title pr-4 flex-1 ${shouldBeActive ? 'font-bold' : 'font-medium'}`}>
                {item.title}
              </span>
              <svg 
                className={`accordion-chevron flex-shrink-0 w-5 h-5 transition-transform duration-200 ${iconPosition === 'left' ? 'order-first mr-3' : ''}`}
                data-slot="accordion-icon" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div 
              className="accordion-content overflow-hidden"
              data-slot="accordion-content"
              id={`accordion-content-${index}`}
            >
              <div 
                className={`accordion-body ${contentPadding[size as keyof typeof contentPadding]} leading-relaxed`}
                data-slot="accordion-body"
                dangerouslySetInnerHTML={{ __html: item.content || '' }}
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccordionBlock;
