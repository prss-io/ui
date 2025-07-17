import React from "react";

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

  return (
    <div 
      className="hero-banner relative flex items-center justify-center"
      style={{
        height,
        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        textAlign: alignment as any,
        color: textColor
      }}
    >
      {overlayColor && (
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: overlayColor }}
        />
      )}
      <div className="relative p-8 max-w-4xl">
        {title && (
          <h1 className="mb-4 text-4xl font-bold">{title}</h1>
        )}
        {subtitle && (
          <p className="mb-8 text-xl">{subtitle}</p>
        )}
        {buttonText && buttonUrl && (
          <a 
            href={buttonUrl} 
            className="btn btn-primary inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Hello2{buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;
