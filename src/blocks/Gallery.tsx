import React from "react";
import { cn } from "@/lib/utils";
import { Image, ChevronLeft, ChevronRight } from "lucide-react";
import "./styles/Gallery.css";
import "./styles/Lightbox.css";

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  thumbnail?: string;
  noZoom?: boolean; // Flag to disable lightbox for specific images
}

interface GalleryProps {
  fields: {
    title?: string;
    description?: string;
    images: string; // JSON string
    columns?: string;
    layout?: "grid" | "carousel" | "justified";
    showCaptions?: string | boolean;
    showTitle?: string | boolean;
    spacing?: "small" | "medium" | "large";
    borderRadius?: string;
    lightbox?: string | boolean;
    aspectRatio?: "auto" | "square" | "landscape" | "portrait" | "wide";
    imageHeight?: string;
    rowHeight?: string;
    attribution?: string; // Optional attribution text
    attributionLink?: string; // Optional attribution link
  };
}

const Gallery: React.FC<GalleryProps> = ({ fields }) => {
  const {
    title = "Image Gallery",
    description = "A collection of beautiful images",
    images = "[]",
    columns = "3",
    layout = "grid",
    showCaptions = true,
    showTitle = true,
    spacing = "medium",
    borderRadius = "8px",
    lightbox = true,
    aspectRatio = "auto",
    imageHeight = "200px",
    rowHeight = "288px",
    attribution = "",
    attributionLink = "",
  } = fields;

  // Convert string booleans to actual booleans
  const shouldShowCaptions = showCaptions === "true" || showCaptions === true;
  const shouldShowTitle = showTitle === "true" || showTitle === true;
  const shouldEnableLightbox = lightbox === "true" || lightbox === true;

  /**
   * Photographs are not squares. Unless a shape was explicitly chosen, lay the
   * gallery out in justified rows that keep each image's own proportions —
   * cropping every one to a grid cell is what makes a gallery look like a
   * contact sheet.
   */
  const effectiveLayout =
    layout === "grid" && aspectRatio === "auto" ? "justified" : layout;

  // Parse images JSON
  let parsedImages: GalleryImage[] = [];
  try {
    parsedImages = JSON.parse(images);
  } catch (error) {
    console.error("Failed to parse gallery images:", error);
  }

  // CSS Grid column count based on columns setting
  const getGridColumns = (cols: string) => {
    return {
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
    };
  };

  // Get gap spacing
  const getGapSpacing = (space: string) => {
    const spacingMap: Record<string, string> = {
      small: "0.5rem",
      medium: "1rem", 
      large: "1.5rem",
    };
    return spacingMap[space] || spacingMap.medium;
  };

  if (parsedImages.length === 0) {
    return (
      <div className="gallery-empty p-8 text-center border-2 border-dashed rounded-lg">
        <Image className="h-12 w-12 mx-auto mb-4" />
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      {/* Gallery Header */}
      {(shouldShowTitle && title) || description ? (
        <div className="gallery-header mb-6">
          {shouldShowTitle && title && (
            <h2 className="gallery-title text-2xl font-bold mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="gallery-description text-lg mb-4">
              {description}
            </p>
          )}
        </div>
      ) : null}

      {/* Gallery Box - Do not modify */}
      <div 
        className={cn("gallery-box", effectiveLayout === "carousel" && "carousel-container")}
        style={{
          "--gallery-gap": getGapSpacing(spacing),
          "--gallery-row-height": rowHeight,
        } as React.CSSProperties}
      >
        {/* Carousel Navigation */}
        {effectiveLayout === "carousel" && (
          <>
            <button className="carousel-nav prev" data-carousel-direction="prev">
              <ChevronLeft size={20} />
            </button>
            <button className="carousel-nav next" data-carousel-direction="next">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {effectiveLayout === "justified" ? (
          <div className="gallery justified" data-gallery-justified>
            {parsedImages.map((image, index) => {
              const zoomable = shouldEnableLightbox && !image.noZoom;
              return (
                <a
                  key={index}
                  className={cn("gallery-item", !zoomable && "no-zoom")}
                  href={image.url}
                  // A real link, so a gallery still works without JavaScript.
                  data-action={zoomable ? "zoom" : undefined}
                  data-gallery-url={image.url}
                  data-gallery-alt={image.alt}
                  data-gallery-caption={image.caption || undefined}
                  style={{ borderRadius }}
                >
                  <img
                    src={image.thumbnail || image.url}
                    alt={image.alt || ""}
                    loading="lazy"
                    // Themes style prose images with vertical margins at the same
                    // specificity as this block's CSS; inside a measured box they
                    // would push the image out of its slot.
                    style={{ borderRadius, margin: 0 }}
                  />
                  {shouldShowCaptions && image.caption && (
                    <span className="gallery-item-caption">{image.caption}</span>
                  )}
                </a>
              );
            })}
          </div>
        ) : (
        <div 
          className={cn("gallery", effectiveLayout)}
          style={{
            ...(effectiveLayout === "grid" && getGridColumns(columns)),
            ...(effectiveLayout === "carousel" && {
              gap: getGapSpacing(spacing),
            }),
          }}
        >
          {parsedImages.map((image, index) => {
            const imageClass = shouldEnableLightbox && !image.noZoom ? "" : "no-zoom";
            const dataAction = shouldEnableLightbox && !image.noZoom ? "zoom" : undefined;
            
            return (
              <img
                key={index}
                src={image.thumbnail || image.url}
                alt={image.alt || ""}
                className={imageClass || undefined}
                data-action={dataAction}
                data-gallery-url={image.url}
                data-gallery-alt={image.alt}
                data-gallery-caption={image.caption || undefined}
                style={{
                  borderRadius: borderRadius,
                  height: aspectRatio === "auto" ? imageHeight : undefined,
                  ...(aspectRatio === "square" && { aspectRatio: "1 / 1" }),
                  ...(aspectRatio === "landscape" && { aspectRatio: "16 / 9" }),
                  ...(aspectRatio === "portrait" && { aspectRatio: "4 / 5" }),
                  ...(aspectRatio === "wide" && { aspectRatio: "21 / 9" }),
                  ...(effectiveLayout === "carousel" && { 
                    flexShrink: 0,
                    width: `calc(100% / ${columns} - ${getGapSpacing(spacing)} * (${columns} - 1) / ${columns})`,
                  }),
                }}
                loading="lazy"
              />
            );
          })}
        </div>
        )}
      </div>

      {/* Attribution */}
      {attribution && (
        <em className="gallery-attribution block text-sm">
          {attribution}
          {attributionLink && (
            <>
              {" / "}
              <a 
                href={attributionLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                {new URL(attributionLink).hostname}
              </a>
            </>
          )}
        </em>
      )}
    </div>
  );
};

export default Gallery;
