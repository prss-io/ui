import React from "react";

import './styles/HeroBanner.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HeroBannerProps {
  fields: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    alignment?: string;
    backgroundImage?: string;
    textColor?: string;
    overlayColor?: string;
    height?: string;
  };
}

const HeroBanner: React.FC<HeroBannerProps> = ({ fields }) => {
  const {
    title,
    subtitle,
    buttonText,
    buttonUrl,
    alignment = 'center',
    backgroundImage,
    textColor = '#ffffff',
    overlayColor = 'rgba(0,0,0,0.5)',
    height = '500px'
  } = fields;

  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'items-start text-left';
      case 'right':
        return 'items-end text-right';
      case 'center':
      default:
        return 'items-center text-center';
    }
  };

  return (
    <Card 
      className="hero-banner relative flex items-center justify-center overflow-hidden border-0"
      style={{
        height,
        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlayColor && (
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: overlayColor }}
        />
      )}
      <CardContent className={`relative p-5 flex flex-col ${getAlignmentClasses(alignment)}`} style={{ color: textColor }}>
        {title && (
          <div className="mb-4 text-4xl font-bold" style={{
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.2)',
            padding: "0 20px 0 20px",
            color: textColor
          }}>{title}</div>
        )}
        {subtitle && (
          <div className="mb-6 mt-4" style={{ color: textColor }}>{subtitle}</div>
        )}
        {buttonText && buttonUrl && (
          <Button variant="outline" asChild>
            <a href={buttonUrl} className="mt-2 btn font-bold text-md px-4 py-2 font-bold" style={{
              color: textColor,
              fontSize: '16px',
            }}>
              {buttonText}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default HeroBanner;
