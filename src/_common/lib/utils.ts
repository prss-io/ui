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
  
  // Parse both JSON blocks and blocks with styles
  const jsonBlockElements = doc.querySelectorAll('[data-block="json"]');
  const styledBlockElements = doc.querySelectorAll('[data-block][data-styles]:not([data-block="json"])');
  
  const blocks = [];
  
  // Process JSON blocks
  jsonBlockElements.forEach((element, index) => {
    const contentAttr = element.getAttribute('data-content');
    const specializedType = element.getAttribute('data-specialized-type');
    const stylesAttr = element.getAttribute('data-styles');
    
    if (contentAttr) {
      try {
        const blockData = JSON.parse(contentAttr.replace(/&quot;/g, '"'));
        blocks.push({
          id: blockData.id || `block-${index}`,
          type: blockData.type,
          specializedType: specializedType || blockData.specializedType,
          content: blockData.content,
          styles: stylesAttr || undefined,
          element: element,
          placeholder: `__BLOCK_${blocks.length}__`
        });
        
        // Replace the block element with a placeholder
        element.outerHTML = `<div data-block-placeholder="__BLOCK_${blocks.length - 1}__"></div>`;
      } catch (error) {
        console.error('Failed to parse block data:', error);
      }
    }
  });
  
  // Process styled non-JSON blocks
  styledBlockElements.forEach((element, index) => {
    const blockId = element.getAttribute('data-block-id');
    const blockType = element.getAttribute('data-block');
    const contentAttr = element.getAttribute('data-content');
    const stylesAttr = element.getAttribute('data-styles');
    
    if (contentAttr) {
      try {
        const blockData = JSON.parse(contentAttr.replace(/&quot;/g, '"'));
        blocks.push({
          id: blockId || `styled-block-${index}`,
          type: blockType,
          content: blockData.content,
          styles: stylesAttr || undefined,
          element: element,
          placeholder: `__BLOCK_${blocks.length}__`
        });
        
        // Replace the block element with a placeholder
        element.outerHTML = `<div data-block-placeholder="__BLOCK_${blocks.length - 1}__"></div>`;
      } catch (error) {
        console.error('Failed to parse styled block data:', error);
      }
    }
  });
  
  return {
    processedHtml: doc.body.innerHTML,
    blocks
  };
};