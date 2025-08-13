import React from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "./styles/CardBlock.css";

export interface CardBlockProps {
  fields: {
    title?: string;
    description?: string;
    image?: string;
    imagePosition?: 'left' | 'right';
    buttonText?: string;
    buttonUrl?: string;
    showButton?: string | boolean;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    padding?: string;
    shadow?: 'none' | 'small' | 'medium' | 'large';
  };
}

const CardBlock: React.FC<CardBlockProps> = ({ fields }) => {
  const {
    title = 'Card Title',
    description = 'This is a description for the card component.',
    image,
    imagePosition = 'left',
    buttonText = 'Learn More',
    buttonUrl = '#',
    showButton = true,
    backgroundColor = '#ffffff',
    textColor = '#333333',
    borderRadius = '8px',
    padding = '24px',
    shadow = 'medium',
  } = fields;

  // Convert string boolean to actual boolean
  const shouldShowButton = typeof showButton === 'string' ? showButton === 'true' : showButton;
  const hasImage = image && image.trim() !== '';

  return (
    <div className="card-block-container">
      <Card 
        className={cn(
          "card-block",
          `card-block--${imagePosition}`,
          `card-block--shadow-${shadow}`,
          hasImage ? "card-block--with-image" : "card-block--no-image"
        )}
        style={{
          backgroundColor,
          color: textColor,
          borderRadius,
          padding,
        }}
      >
        {hasImage && (
          <div className="card-block__image">
            <img 
              src={image} 
              alt={title} 
              style={{ borderRadius }}
            />
          </div>
        )}
        <div className="card-block__content ml-2">
          <CardHeader className="card-block__header">
            <CardTitle 
              className="card-block__title"
              style={{ color: textColor }}
            >
              {title}
            </CardTitle>
            <CardDescription 
              className="card-block__description"
              style={{ color: textColor }}
            >
              {description}
            </CardDescription>
          </CardHeader>
          {shouldShowButton && (
            <CardContent className="card-block__footer">
              <Button 
                variant="default"
                asChild 
                className="card-block__button"
              >
                <a href={buttonUrl} style={{ color: textColor }}>
                  {buttonText}
                </a>
              </Button>
            </CardContent>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CardBlock;
