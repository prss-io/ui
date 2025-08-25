import React from 'react';
import { cn } from "@/lib/utils";
import { ExternalLink, Link } from "lucide-react";
import "./styles/LinkList.css";

interface LinkItem {
  title: string;
  description?: string;
  url?: string;
  icon?: string;
  openInNewTab?: boolean;
}

interface LinkListProps {
  fields: {
    title?: string;
    description?: string;
    links: string; // JSON string
    layoutStyle?: "styled" | "minimal";
    layoutOrientation?: "list" | "grid" | "inline";
    iconPosition?: "left" | "right" | "top";
    showDescriptions?: string | boolean;
    showIcons?: string | boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    linkColor?: string;
    hoverColor?: string;
    borderRadius?: string;
    spacing?: "small" | "medium" | "large";
  };
}

const LinkList: React.FC<LinkListProps> = ({ fields }) => {
  const {
    title = "Link Collection",
    description = "A curated list of useful links",
    links = "[]",
    layoutStyle = "styled",
    layoutOrientation = "list",
    iconPosition = "left",
    showDescriptions = true,
    showIcons = true,
    backgroundColor = "#ffffff",
    borderColor = "#e5e5e5",
    textColor = "#333333",
    linkColor = "#3b82f6",
    hoverColor = "#2563eb",
    borderRadius = "8px",
    spacing = "medium",
  } = fields;

  // Parse links from JSON string
  let parsedLinks: LinkItem[] = [];
  try {
    parsedLinks = JSON.parse(links);
  } catch (error) {
    console.warn("Failed to parse links JSON:", error);
    parsedLinks = [];
  }

  // Convert string booleans to actual booleans
  const shouldShowDescriptions = typeof showDescriptions === 'string' ? showDescriptions === 'true' : showDescriptions;
  const shouldShowIcons = typeof showIcons === 'string' ? showIcons === 'true' : showIcons;

  // Handle empty links array
  if (!parsedLinks || parsedLinks.length === 0) {
    return (
      <div className="link-list-container">
        <div className="link-list-header">
          <div className="link-list-title">{title}</div>
          {description && <div className="link-list-description">{description}</div>}
        </div>
        <div className="link-list-empty">
          <div>No links available</div>
        </div>
      </div>
    );
  }

  // Function to render a FontAwesome icon
  const renderIcon = (iconClass: string) => {
    if (!iconClass || !shouldShowIcons) return null;
    
    // Return the FontAwesome icon class as-is
    return <i className={iconClass}></i>;
  };

  const renderLink = (link: LinkItem, index: number) => {
    const hasUrl = link.url && link.url.trim() !== '';
    const linkProps = hasUrl ? {
      href: link.url,
      target: link.openInNewTab ? "_blank" : undefined,
      rel: link.openInNewTab ? "noopener noreferrer" : undefined,
    } : {};

    const linkContent = (
      <div className={cn(
        "link-item-content",
        `link-item--${layoutStyle}`,
        `link-item--${layoutOrientation}`,
        `link-item--icon-${iconPosition}`
      )}>
        <div className="link-item-header">
          {shouldShowIcons && iconPosition === "left" && (
            <span className="link-item-icon link-item-icon--left">
              {renderIcon(link.icon || '')}
            </span>
          )}
          
          <div className="link-item-text">
            {shouldShowIcons && iconPosition === "top" && (
              <div className="link-item-icon link-item-icon--top">
                {renderIcon(link.icon || '')}
              </div>
            )}
            <div className="link-item-title">{link.title}</div>
            {shouldShowDescriptions && link.description && (
              <div className="link-item-description">{link.description}</div>
            )}
          </div>
          
          {shouldShowIcons && iconPosition === "right" && (
            <span className="link-item-icon link-item-icon--right">
              {hasUrl ? <ExternalLink size={16} /> : renderIcon(link.icon || '')}
            </span>
          )}
        </div>
      </div>
    );



    // Regular list or grid item
    return hasUrl ? (
      <a key={index} {...linkProps} className="link-item">
        {linkContent}
      </a>
    ) : (
      <div key={index} className="link-item link-item--no-url">
        {linkContent}
      </div>
    );
  };

  const containerStyles = layoutStyle === "styled" ? {
    backgroundColor: backgroundColor !== "transparent" ? backgroundColor : undefined,
    borderColor,
    borderRadius,
    '--link-color': linkColor,
    '--hover-color': hoverColor,
    '--text-color': textColor,
  } as React.CSSProperties : {};

  return (
    <div 
      className={cn(
        "link-list-container",
        `link-list--${layoutStyle}`,
        `link-list--${layoutOrientation}`,
        `link-list--spacing-${spacing}`
      )}
      style={containerStyles}
    >
      <div className="link-list-header">
        <div className="link-list-title">{title}</div>
        {description && <div className="link-list-description">{description}</div>}
      </div>
      
      <div 
        className={cn(
          "link-list-content",
          `link-list-content--${layoutOrientation}`
        )}
      >
        {parsedLinks.map((link, index) => renderLink(link, index))}
      </div>
    </div>
  );
};

export default LinkList;