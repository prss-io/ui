import React from "react";
import HeroBanner from "./HeroBanner";
import CodeBlock from "./CodeBlock";
import Gallery from "./Gallery";

// Registry of block components
const blockComponents = {
  hero: HeroBanner,
  "code-block": CodeBlock,
  gallery: Gallery,
  // Add more block types here as needed
};

interface BlockRendererProps {
  type: string;
  specializedType?: string;
  content: any;
  id: string;
  customBlockComponents?: Record<string, React.ComponentType<any>>;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  type, 
  specializedType, 
  content, 
  id,
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
  
  return (
    <div data-block-id={id}>
      <Component {...content} />
    </div>
  );
};

export default BlockRenderer;
