import React from "react";
import HeroBanner from "./HeroBanner";
import CodeBlock from "./CodeBlock";
import Gallery from "./Gallery";
import CardBlock from "./CardBlock";
import AccordionBlock from "./AccordionBlock";
import TimelineBlock from "./TimelineBlock";
import AnimatedWrapper from "./AnimatedWrapper";

// Registry of block components
const blockComponents = {
  hero: HeroBanner,
  "code-block": CodeBlock,
  gallery: Gallery,
  card: CardBlock,
  accordion: AccordionBlock,
  timeline: TimelineBlock,
  // Add more block types here as needed
};

interface BlockRendererProps {
  type: string;
  specializedType?: string;
  content: any;
  id: string;
  styles?: string;
  customBlockComponents?: Record<string, React.ComponentType<any>>;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  type, 
  specializedType, 
  content, 
  id,
  styles,
  customBlockComponents = {}
}) => {
  // Merge static block components with custom ones, with custom taking precedence
  const mergedBlockComponents = { ...blockComponents, ...customBlockComponents };
  
  const componentKey = specializedType || type;
  const Component = mergedBlockComponents[componentKey];
  
  if (!Component) {
    console.warn(`No component found for block type: ${componentKey}`);
    return null;
  }

  // Parse styles string to extract animation properties and regular CSS
  const parseStylesAndAnimations = (stylesString: string) => {
    if (!stylesString) return { styles: {}, animations: {} };
    
    const styles: React.CSSProperties = {};
    const animations: any = {};
    
    stylesString.split(';').forEach(style => {
      const [prop, value] = style.split(':').map(s => s.trim());
      if (!prop || !value) return;
      
      // Check for animation custom properties
      if (prop.startsWith('--animation-')) {
        const animationProp = prop.replace('--animation-', '');
        switch (animationProp) {
          case 'type':
            animations.animationType = value;
            break;
          case 'duration':
            animations.animationDuration = parseFloat(value.replace('s', ''));
            break;
          case 'delay':
            animations.animationDelay = parseFloat(value.replace('s', ''));
            break;
          case 'direction':
            animations.animationDirection = value;
            break;
          case 'easing':
            animations.animationEasing = value;
            break;
          case 'iterations':
            animations.animationIterations = value;
            break;
          case 'trigger':
            animations.animationTrigger = value;
            break;
        }
      } else {
        // Regular CSS property
        const camelCaseProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styles[camelCaseProp] = value;
      }
    });
    
    return { styles, animations };
  };
  
  const { styles: parsedStyles, animations } = parseStylesAndAnimations(styles || '');
  
  return (
    <AnimatedWrapper 
      {...animations}
      style={parsedStyles}
    >
      <div data-block-id={id} className="mb-6">
        <Component {...content} />
      </div>
    </AnimatedWrapper>
  );
};

export default BlockRenderer;
