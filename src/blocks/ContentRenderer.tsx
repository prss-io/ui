import React from "react";
import { parseBlockElements } from "@/lib/utils";
import BlockRenderer from "./BlockRenderer";

interface ContentRendererProps {
  content: string;
  className?: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className }) => {
  const { processedHtml, blocks } = parseBlockElements(content);
  
  // Split the processed HTML by block placeholders
  const parts = processedHtml.split(/(<div data-block-placeholder="__BLOCK_\d+__"><\/div>)/);
  
  return (
    <div className={className}>
      {parts.map((part, index) => {
        // Check if this part is a block placeholder
        const placeholderMatch = part.match(/data-block-placeholder="(__BLOCK_\d+__)"/);
        
        if (placeholderMatch) {
          const placeholder = placeholderMatch[1];
          const block = blocks.find(b => b.placeholder === placeholder);
          
          if (block) {
            return (
              <BlockRenderer
                key={block.id}
                type={block.type}
                specializedType={block.specializedType}
                content={block.content}
                id={block.id}
              />
            );
          }
        }
        
        // Regular HTML content
        if (part.trim()) {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }
        
        return null;
      })}
    </div>
  );
};

export default ContentRenderer;
