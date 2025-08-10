import React from "react";
import HeroBanner from "./HeroBanner";
import CodeBlock from "./CodeBlock";
import Gallery from "./Gallery";
import CardBlock from "./CardBlock";

// Registry of block components
const blockComponents = {
  hero: HeroBanner,
  "code-block": CodeBlock,
  gallery: Gallery,
  card: CardBlock,
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

  // Parse styles string to React CSSProperties object
  const parseStyles = (stylesString: string): React.CSSProperties => {
    if (!stylesString) return {};
    
    return stylesString.split(';').reduce((acc, style) => {
      const [prop, value] = style.split(':').map(s => s.trim());
      if (prop && value) {
        // Convert kebab-case to camelCase for React
        const camelCaseProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelCaseProp] = value;
      }
      return acc;
    }, {} as React.CSSProperties);
  };
  
  return (
    <div 
      data-block-id={id}
      style={styles ? parseStyles(styles) : {}}
    >
      <Component {...content} />
    </div>
  );
};

export default BlockRenderer;
