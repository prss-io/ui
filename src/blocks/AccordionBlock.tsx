import React from 'react';
import './styles/AccordionBlock.css';

interface AccordionBlockProps {
  fields: {
    title?: string;
    behavior?: string;
    variant?: string;
    size?: string;
    items?: string; // JSON string of accordion items
    // Legacy fields for backward compatibility
    allowMultiple?: string;
    firstItemOpen?: string;
    alwaysOpen?: string;
  };
}

const AccordionBlock: React.FC<AccordionBlockProps> = ({ fields }) => {
  const {
    title = 'Frequently Asked Questions',
    behavior = 'single',
    variant = 'default',
    size = 'md',
    items = '[]',
    // Legacy fields for backward compatibility
    allowMultiple,
    firstItemOpen,
    alwaysOpen
  } = fields;

  // Handle backward compatibility by converting legacy fields to behavior
  let actualBehavior = behavior;
  if (behavior === 'single' && allowMultiple === 'true') {
    actualBehavior = 'multiple';
  } else if (behavior === 'single' && firstItemOpen === 'true') {
    actualBehavior = 'firstOpen';
  } else if (behavior === 'single' && alwaysOpen === 'true') {
    actualBehavior = 'alwaysOpen';
  }

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
      data-behavior={actualBehavior}
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
      >
        {validItems.map((item, index) => {
          const isFirstItem = index === 0;
          const shouldBeActive = actualBehavior === 'alwaysOpen' || (isFirstItem && actualBehavior === 'firstOpen');
          
          return (
            <div 
              key={index} 
              data-slot="accordion-item" 
              className={`accordion-item ${variantClasses[variant as keyof typeof variantClasses]} ${shouldBeActive ? 'active' : ''}`}
            >
              <button 
                type="button"
                data-slot="accordion-trigger"
                className={`accordion-trigger w-full ${triggerPadding[size as keyof typeof triggerPadding]} text-left flex items-center justify-between hover:bg-opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset ${variant === 'filled' ? 'bg-opacity-50' : ''}`}
                aria-expanded={shouldBeActive ? "true" : "false"}
                aria-controls={`accordion-content-${index}`}
                disabled={actualBehavior === 'alwaysOpen'}
              >
              <span className={`accordion-title pr-4 flex-1 ${shouldBeActive ? 'font-bold' : 'font-medium'}`}>
                {item.title}
              </span>
              {actualBehavior !== 'alwaysOpen' && (
                <svg 
                  className="accordion-chevron flex-shrink-0 w-5 h-5 transition-transform duration-200"
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
              )}
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
