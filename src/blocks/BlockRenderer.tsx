import React from "react";
import HeroBanner from "./HeroBanner";

// Registry of block components
const blockComponents = {
  hero: HeroBanner,
  // Add more block types here as needed
};

interface BlockRendererProps {
  type: string;
  specializedType?: string;
  content: any;
  id: string;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  type, 
  specializedType, 
  content, 
  id 
}) => {
  const componentKey = specializedType || type;
  const Component = blockComponents[componentKey];
  
  if (!Component) {
    console.warn(`No component found for block type: ${componentKey}`);
    return null;
  }
  
  return <Component {...content} key={id} />;
};

export default BlockRenderer;
