import classnames from "classnames";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cx = classnames;

export const isset = str => !!(str && str.trim().length);
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFlattenedMenuNodes = nodes => {
  const items = [];
  const parseNode = node => {
    if (node) {
      items.push(node);
      if (node.children) {
        node.children.forEach(parseNode);
      }
    }
  };
  nodes.forEach(parseNode);
  return items;
};

export const parseBlockElements = (htmlContent: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const blockElements = doc.querySelectorAll('[data-block="json"]');
  
  const blocks = [];
  blockElements.forEach((element, index) => {
    const contentAttr = element.getAttribute('data-content');
    const specializedType = element.getAttribute('data-specialized-type');
    
    if (contentAttr) {
      try {
        const blockData = JSON.parse(contentAttr.replace(/&quot;/g, '"'));
        blocks.push({
          id: blockData.id || `block-${index}`,
          type: blockData.type,
          specializedType: specializedType || blockData.specializedType,
          content: blockData.content,
          element: element,
          placeholder: `__BLOCK_${index}__`
        });
        
        // Replace the block element with a placeholder
        element.outerHTML = `<div data-block-placeholder="__BLOCK_${index}__"></div>`;
      } catch (error) {
        console.error('Failed to parse block data:', error);
      }
    }
  });
  
  return {
    processedHtml: doc.body.innerHTML,
    blocks
  };
};