import { attachSearch } from "../../search";
import { justifiedLayout } from "./justifiedLayout";

// Server-rendered pages load only this bundle, so search has to be published
// here for a theme's own script to be able to call it.
attachSearch();

document.addEventListener('DOMContentLoaded', function() {
  initCodeBlockCopyFunctionality();
  initGalleryLightbox();
  initJustifiedGalleries();
  initCarouselNavigation();
  initBlockAnimations();
  initAccordionEventListeners();
  initMobileMenuFunctionality();
  initEmbedBlocks();
});

// Lazily-loaded gallery images often finish after DOMContentLoaded.
window.addEventListener('load', () => initJustifiedGalleries());

// Embed blocks: promote the framed iframe to a full-screen overlay so long
// third-party pages are actually readable/navigable.
function initEmbedBlocks() {
  const setBtn = (embed: HTMLElement, expanded: boolean) => {
    const btn = embed.querySelector('[data-embed-expand]');
    if (btn) {
      btn.innerHTML = expanded
        ? '<span aria-hidden="true">\u2715</span> Close'
        : '<span aria-hidden="true">\u2922</span> Expand';
    }
  };

  // The host theme may wrap content in a stacking context (e.g. a positioned
  // shell with a z-index), which would trap a position:fixed overlay beneath the
  // site header. Re-parenting to <body> while expanded avoids that entirely.
  const expand = (embed: HTMLElement) => {
    // Theme tokens (CSS custom properties) stop inheriting once the node leaves
    // the themed subtree, so pin the resolved surface colours before moving it.
    const surface = embed.closest('[data-theme]') || document.body;
    const scs = getComputedStyle(surface as HTMLElement);
    const bg = scs.backgroundColor;
    embed.style.backgroundColor = bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : getComputedStyle(document.body).backgroundColor;
    embed.style.color = scs.color;

    const marker = document.createElement('div');
    marker.setAttribute('data-embed-placeholder', '');
    marker.style.display = 'none';
    embed.parentNode?.insertBefore(marker, embed);
    (embed as any).__embedMarker = marker;
    document.body.appendChild(embed);
    embed.classList.add('is-expanded');
    document.body.classList.add('embed-block-open');
    setBtn(embed, true);
  };

  const collapse = (embed: HTMLElement) => {
    embed.classList.remove('is-expanded');
    document.body.classList.remove('embed-block-open');
    embed.style.backgroundColor = '';
    embed.style.color = '';
    const marker = (embed as any).__embedMarker as HTMLElement | undefined;
    if (marker && marker.parentNode) {
      marker.parentNode.insertBefore(embed, marker);
      marker.remove();
      (embed as any).__embedMarker = null;
    }
    setBtn(embed, false);
  };

  document.querySelectorAll('[data-embed-block]').forEach((node) => {
    const embed = node as HTMLElement;
    const btn = embed.querySelector('[data-embed-expand]') as HTMLButtonElement | null;
    if (!btn || btn.getAttribute('data-embed-bound') === 'true') return;
    btn.setAttribute('data-embed-bound', 'true');

    btn.addEventListener('click', () => {
      if (embed.classList.contains('is-expanded')) collapse(embed);
      else expand(embed);
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key !== 'Escape') return;
    document.querySelectorAll('[data-embed-block].is-expanded').forEach((n) => collapse(n as HTMLElement));
  });
}

function initAccordionEventListeners() {
  // Find all accordion triggers and attach direct event listeners
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  
  accordionTriggers.forEach(trigger => {
    const triggerElement = trigger as HTMLButtonElement;
    
    // Remove any existing listeners to prevent duplicates
    triggerElement.removeEventListener('click', handleAccordionClick);
    triggerElement.removeEventListener('keydown', handleAccordionKeydown);
    
    // Attach direct event listeners
    triggerElement.addEventListener('click', handleAccordionClick);
    triggerElement.addEventListener('keydown', handleAccordionKeydown);
  });
}

function initMobileMenuFunctionality() {
  // Handle mobile menu visibility based on screen size and toggle state
  const mobileMenuToggles = document.querySelectorAll('[data-mobile-menu-toggle]');
  const mobileMenus = document.querySelectorAll('[data-mobile-menu]');

  // Function to check if we're on mobile
  const isMobile = () => window.innerWidth < 992;

  // Function to update menu visibility
  const updateMenuVisibility = () => {
    mobileMenus.forEach(menu => {
      const toggle = document.querySelector(`[data-mobile-menu-toggle="${menu.getAttribute('data-mobile-menu')}"]`);
      const isToggled = toggle?.getAttribute('data-mobile-menu-open') === 'true';
      
      if (isMobile()) {
        // On mobile, show/hide based on toggle state
        menu.classList.toggle('hidden', !isToggled);
      } else {
        // On desktop, always show
        menu.classList.remove('hidden');
      }
    });
  };

  // Handle toggle button clicks
  mobileMenuToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-mobile-menu-toggle');
      const isOpen = toggle.getAttribute('data-mobile-menu-open') === 'true';
      
      // Update toggle state
      toggle.setAttribute('data-mobile-menu-open', (!isOpen).toString());
      
      // Update chevron rotation
      const chevron = toggle.querySelector('.mobile-menu-chevron');
      if (chevron) {
        chevron.classList.toggle('rotate-180', !isOpen);
      }
      
      // Update menu visibility
      updateMenuVisibility();
    });
  });

  // Handle window resize with debouncing for performance
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    // Update immediately for instant feedback
    updateMenuVisibility();
    
    // Also debounce for any cleanup operations
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      updateMenuVisibility();
    }, 250);
  });
  
  // Initial setup
  updateMenuVisibility();
}

document.querySelectorAll(".post-inner-content img")?.forEach((img) => {
  if (img && !img.classList.contains("no-zoom") && img.getAttribute("data-action") !== "none") {
    const testImg = new Image();
    testImg.onload = function() {
      if (testImg.naturalWidth > 500 && testImg.naturalHeight > 500) {
        img.setAttribute("data-action", "zoom");
      }
    };
    testImg.src = img.getAttribute("src") || "";
  }
});

function initCodeBlockCopyFunctionality() {
  const copyButtons = document.querySelectorAll('.code-block__copy-button');
  
  copyButtons.forEach(button => {
    const buttonElement = button as HTMLButtonElement;
    buttonElement.addEventListener('click', async function() {
      const codeBlock = buttonElement.closest('.code-block');
      if (!codeBlock) return;
      
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;
      
      let codeText = '';
      
      const codeLines = codeElement.querySelectorAll('.code-line');
      if (codeLines.length > 0) {
        codeText = Array.from(codeLines).map(line => {
          const lineContent = line.querySelector('.line-content');
          return lineContent ? lineContent.textContent || '' : '';
        }).join('\n');
      } else {
        codeText = codeElement.textContent || '';
      }
      
      try {
        await navigator.clipboard.writeText(codeText);
        
        const copyIcon = buttonElement.querySelector('.copy-icon');
        const copiedIcon = buttonElement.querySelector('.copied-icon');
        
        if (copyIcon && copiedIcon) {
          copyIcon.classList.add('hidden');
          copiedIcon.classList.remove('hidden');
          
          const originalClasses = buttonElement.className;
          buttonElement.className = buttonElement.className.replace(
            /bg-\w+-\d+|text-\w+-\d+|border-\w+-\d+/g, 
            ''
          ).trim() + ' bg-green-100 text-green-800 border-green-300';
          buttonElement.title = 'Copied!';
          buttonElement.setAttribute('data-copy-state', 'copied');
          
          setTimeout(() => {
            buttonElement.className = originalClasses;
            buttonElement.title = 'Copy code';
            buttonElement.setAttribute('data-copy-state', 'idle');
            copyIcon.classList.remove('hidden');
            copiedIcon.classList.add('hidden');
          }, 2000);
        }
        
      } catch (err) {
        try {
          const range = document.createRange();
          range.selectNodeContents(codeElement);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (selectErr) {
        }
      }
    });
  });
}

function initBlockAnimations() {
  if (!document.getElementById('prss-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'prss-animation-styles';
    style.textContent = getAnimationCSS();
    document.head.appendChild(style);
  }

  const animatedBlocks = document.querySelectorAll('.prss-animate');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target as HTMLElement;
      const trigger = element.dataset.animationTrigger;
      
      if (trigger === 'onVisible' || trigger === 'onScroll') {
        if (entry.isIntersecting) {
          triggerAnimation(element);
        }
      }
    });
  }, observerOptions);
  
  animatedBlocks.forEach(block => {
    const element = block as HTMLElement;
    const trigger = element.dataset.animationTrigger;
    
    element.dataset.animationState = 'idle';
    
    switch (trigger) {
      case 'onLoad':
        break;
        
      case 'onVisible':
      case 'onScroll':
        observer.observe(element);
        break;
        
      case 'onHover':
        element.addEventListener('mouseenter', () => {
          if (element.dataset.animationState === 'running') {
            return;
          }
          triggerAnimation(element);
        });
        element.addEventListener('mouseleave', () => {
          const category = element.dataset.animationCategory;
          const iterations = element.dataset.animationIterations || '1';
          
          if (iterations !== 'infinite' && element.dataset.animationState !== 'running') {
            if (category === 'continuous') {
              resetAnimation(element);
            } else if (category === 'entrance') {
              resetAnimation(element);
            } else {
              resetAnimation(element);
            }
          }
        });
        break;
        
      case 'onClick':
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => {
          const iterations = element.dataset.animationIterations || '1';
          
          if (element.dataset.animationState === 'running') {
            return;
          }
          
          triggerAnimation(element);
          
          if (iterations !== 'infinite') {
            const duration = parseFloat(element.dataset.animationDuration || '1') * 1000;
            const delay = parseFloat(element.dataset.animationDelay || '0') * 1000;
            setTimeout(() => {
              resetAnimation(element);
            }, duration + delay + 100);
          }
        });
        break;
    }
  });
}

function triggerAnimation(element: HTMLElement) {
  const animationType = element.dataset.animationType;
  const duration = element.dataset.animationDuration || '1';
  const delay = element.dataset.animationDelay || '0';
  const easing = element.dataset.animationEasing || 'ease-in-out';
  const iterations = element.dataset.animationIterations || '1';
  const direction = element.dataset.animationDirection || 'normal';
  const trigger = element.dataset.animationTrigger;
  const category = element.dataset.animationCategory;
  
  if (element.classList.contains('prss-animated') && element.dataset.animationState === 'running') {
    return;
  }
  
  if (animationType && animationType !== 'none') {
    element.dataset.animationState = 'running';
    
    element.style.animationName = 'none';
    element.offsetHeight;
    
    if (category === 'entrance') {
      if (trigger === 'onVisible' || trigger === 'onScroll') {
        if (animationType.includes('fade') || animationType.includes('scale') || animationType.includes('zoom') || animationType.includes('bounce') || animationType.includes('rotate')) {
          element.style.opacity = '0';
        }
      } else if (trigger === 'onHover' || trigger === 'onClick') {
        if (animationType.includes('fade') && !animationType.includes('scale') && !animationType.includes('zoom') && !animationType.includes('rotate')) {
          element.style.opacity = '0';
        } else {
          element.style.opacity = '1';
        }
      } else {
        element.style.opacity = '1';
      }
      
      element.offsetHeight;
    } else if (category === 'continuous') {
      element.style.opacity = '1';
      element.offsetHeight;
    }
    
    let fillMode = 'both';
    if (category === 'entrance' && iterations !== 'infinite') {
      fillMode = 'forwards';
    } else if (category === 'continuous') {
      fillMode = 'none';
    }
    
    let finalAnimationType = animationType;
    
    if (trigger === 'onHover' || trigger === 'onClick') {
      switch (animationType) {
        case 'scaleIn':
          finalAnimationType = 'scaleUp';
          break;
        case 'zoomIn':
          finalAnimationType = 'zoomUp';
          break;
        case 'rotateIn':
          finalAnimationType = Math.random() > 0.5 ? 'rotateLeft' : 'rotateRight';
          break;
        default:
          finalAnimationType = animationType;
      }
    }
    
    element.style.animationName = finalAnimationType;
    element.style.animationDuration = `${duration}s`;
    element.style.animationDelay = `${delay}s`;
    element.style.animationTimingFunction = easing;
    element.style.animationIterationCount = iterations === 'infinite' ? 'infinite' : iterations;
    element.style.animationDirection = direction;
    element.style.animationFillMode = fillMode;
    
    element.classList.add('prss-animated');
    
    const totalDuration = (parseFloat(duration) + parseFloat(delay)) * 1000;
    
    const handleAnimationEnd = () => {
      element.dataset.animationState = 'complete';
      
      if (category === 'entrance' && iterations !== 'infinite') {
        element.style.opacity = '1';
        element.style.transform = "initial";
      }
    };
    
    if (iterations !== 'infinite') {
      setTimeout(handleAnimationEnd, totalDuration);
    }
    
    if (category === 'entrance' && iterations !== 'infinite') {
      const totalDuration = (parseFloat(duration) + parseFloat(delay)) * 1000;
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = "initial";
      }, totalDuration);
    }
  }
}

function resetAnimation(element: HTMLElement) {
  const iterations = element.dataset.animationIterations || '1';
  const trigger = element.dataset.animationTrigger;
  const category = element.dataset.animationCategory;
  
  if (iterations === 'infinite') return;
  
  element.dataset.animationState = 'idle';
  
  element.style.animationName = 'none';
  element.offsetHeight;
  
  element.classList.remove('prss-animated');
  
  if (trigger === 'onHover') {
    if (category === 'entrance') {
      element.style.opacity = '1';
    } else if (category === 'continuous') {
      element.style.opacity = '1';
    }
  } else if (trigger === 'onClick') {
    if (category === 'entrance') {
      element.style.opacity = '1';
    } else if (category === 'continuous') {
      element.style.opacity = '1';
    }
  } else {
    if (category === 'entrance') {
      element.style.opacity = '1';
    } else if (category === 'continuous') {
      element.style.opacity = '1';
    }
  }
}

function getAnimationCSS(): string {
  return `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-50px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInUp {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInDown {
  from { transform: translateY(-100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes rotateIn {
  from { transform: rotate(-180deg); opacity: 0; }
  to { transform: rotate(0deg); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

@keyframes zoomUp {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes rotateLeft {
  from { transform: rotate(0deg); }
  to { transform: rotate(-5deg); }
}

@keyframes rotateRight {
  from { transform: rotate(0deg); }
  to { transform: rotate(5deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes wobble {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(-5deg); }
  30% { transform: rotate(5deg); }
  45% { transform: rotate(-3deg); }
  60% { transform: rotate(3deg); }
  75% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

.prss-animate {
  opacity: 1;
}

.prss-animate.entrance-animation.animate-onvisible:not(.prss-animated),
.prss-animate.entrance-animation.animate-onscroll:not(.prss-animated) {
  opacity: 0;
}

.prss-animate.continuous-animation {
  opacity: 1;
}

.prss-animate.prss-animated.entrance-animation {
  opacity: 1 !important;
}
`;
}

function initCarouselNavigation() {
  const carouselContainers = document.querySelectorAll('.gallery-box.carousel-container');
  
  carouselContainers.forEach(container => {
    const gallery = container.querySelector('.gallery.carousel') as HTMLElement;
    const prevBtn = container.querySelector('.carousel-nav.prev') as HTMLButtonElement;
    const nextBtn = container.querySelector('.carousel-nav.next') as HTMLButtonElement;
    
    if (!gallery || !prevBtn || !nextBtn) {
      return;
    }
    
    function getScrollAmount() {
      return gallery.clientWidth * 0.8;
    }
    
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      gallery.scrollBy({
        left: -getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      gallery.scrollBy({
        left: getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
    function updateButtonStates() {
      const scrollLeft = gallery.scrollLeft;
      const maxScroll = gallery.scrollWidth - gallery.clientWidth;
      
      prevBtn.disabled = scrollLeft <= 1;
      nextBtn.disabled = scrollLeft >= maxScroll - 1;
      
      prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
      nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
    }
    
    setTimeout(updateButtonStates, 100);
    
    gallery.addEventListener('scroll', updateButtonStates);
    
    window.addEventListener('resize', updateButtonStates);
  });
}

function initGalleryLightbox() {
  // Create lightbox if it doesn't exist
  let lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) {
    lightbox = createLightboxModal();
    document.body.appendChild(lightbox);
  }

  const viewport = lightbox.querySelector('.gallery-lightbox__viewport') as HTMLElement;
  const lightboxImage = lightbox.querySelector('.gallery-lightbox__img') as HTMLImageElement;
  const lightboxCaption = lightbox.querySelector('.gallery-lightbox__caption') as HTMLElement;
  const lightboxTitle = lightbox.querySelector('.gallery-lightbox__caption-title') as HTMLElement;
  const lightboxCaptionText = lightbox.querySelector('.gallery-lightbox__caption-text') as HTMLElement;
  const counter = lightbox.querySelector('.gallery-lightbox__counter') as HTMLElement;
  const downloadBtn = lightbox.querySelector('.gallery-lightbox__button--download') as HTMLAnchorElement;
  const zoomBtn = lightbox.querySelector('.gallery-lightbox__button--zoom') as HTMLButtonElement;
  const closeBtn = lightbox.querySelector('.gallery-lightbox__button--close') as HTMLButtonElement;
  const prevBtn = lightbox.querySelector('.gallery-lightbox__button--prev') as HTMLButtonElement;
  const nextBtn = lightbox.querySelector('.gallery-lightbox__button--next') as HTMLButtonElement;

  let currentIndex = 0;
  let currentGalleryImages: Element[] = [];
  let isOpen = false;
  let isZoomed = false;
  let closeTimer = 0;

  // Arrows are for pointer users; touch galleries swipe instead.
  window.addEventListener('mousemove', () => { lightbox.dataset.hasMouse = 'true'; }, { once: true });

  // Use event delegation to handle all images with data-action="zoom"
  document.addEventListener('click', function(e) {
    const target = e.target as HTMLElement;

    // A justified gallery wraps each image in an anchor so it still works
    // without JavaScript; a grid gallery zooms the image itself.
    const zoomable = target.closest('[data-action="zoom"]') as HTMLElement | null;
    if (!zoomable) return;

    e.preventDefault();

    const galleryBox = zoomable.closest('.gallery-box');
    const selector = zoomable.tagName === 'A'
      ? 'a[data-action="zoom"]'
      : 'img[data-action="zoom"]';

    const scope = galleryBox || document;
    currentGalleryImages = Array.from(scope.querySelectorAll(selector));

    currentIndex = currentGalleryImages.indexOf(zoomable);
    showLightbox(currentIndex, true);
  });
  
  function createLightboxModal(): HTMLElement {
    // Icon shapes are PhotoSwipe's (photoswipe.com, MIT); each is drawn twice so
    // the stroked copy underneath gives the outline that keeps it legible on
    // both light and dark images.
    const icon = (path: string, size = 32, extra = "") => `
      <svg class="gallery-lightbox__icn" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
        <path class="gallery-lightbox__icn-shadow" d="${path}"/>
        <path d="${path}"/>
        ${extra}
      </svg>`;

    const closeIcon = icon("M24 10l-2-2-6 6-6-6-2 2 6 6-6 6 2 2 6-6 6 6 2-2-6-6z");
    const zoomIcon = icon(
      "M17.426 19.926a6 6 0 1 1 1.5-1.5L23 22.5 21.5 24l-4.074-4.074z",
      32,
      '<path fill="currentColor" d="M11 16v-2h6v2z"/><path class="gallery-lightbox__zoom-bar-v" fill="currentColor" d="M13 12h2v6h-2z"/>'
    );
    const downloadIcon = icon("M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z");
    const arrowIcon = icon("M29 43l-3 3-16-16 16-16 3 3-13 13 13 13z", 60);

    const modal = document.createElement('div');
    modal.id = 'gallery-lightbox';
    modal.className = 'gallery-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.dataset.open = 'false';
    modal.innerHTML = `
      <div class="gallery-lightbox__bg"></div>
      <div class="gallery-lightbox__viewport">
        <img class="gallery-lightbox__img" src="" alt="">
      </div>
      <div class="gallery-lightbox__caption gallery-lightbox__ui">
        <span class="gallery-lightbox__caption-title"></span>
        <span class="gallery-lightbox__caption-text"></span>
      </div>
      <div class="gallery-lightbox__top-bar gallery-lightbox__ui">
        <div class="gallery-lightbox__counter"></div>
        <a class="gallery-lightbox__button gallery-lightbox__button--download" title="Download" download target="_blank" rel="noopener">${downloadIcon}</a>
        <button class="gallery-lightbox__button gallery-lightbox__button--zoom" type="button" title="Zoom">${zoomIcon}</button>
        <button class="gallery-lightbox__button gallery-lightbox__button--close" type="button" title="Close">${closeIcon}</button>
      </div>
      <button class="gallery-lightbox__button gallery-lightbox__button--arrow gallery-lightbox__button--prev gallery-lightbox__ui" type="button" title="Previous">${arrowIcon}</button>
      <button class="gallery-lightbox__button gallery-lightbox__button--arrow gallery-lightbox__button--next gallery-lightbox__ui" type="button" title="Next">${arrowIcon}</button>
    `;
    return modal;
  }
  
  function thumbRectOf(index: number): DOMRect | null {
    const el = currentGalleryImages[index] as HTMLElement | undefined;
    if (!el) return null;
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    const rect = (img || el).getBoundingClientRect();
    return rect.width && rect.height ? rect : null;
  }

  /**
   * Transform that places the opened image over its thumbnail. The scale is
   * uniform — matching the thumbnail's box on both axes would squash the photo,
   * since thumbnails are cropped to fill their slot.
   */
  function thumbTransform(from: DOMRect, to: DOMRect) {
    const scale = from.width / to.width;
    const x = from.left - to.left;
    const y = from.top + from.height / 2 - to.top - (to.height * scale) / 2;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }

  /** Grow the opened image out of its thumbnail, the way photo viewers do. */
  function animateFromThumb(from: DOMRect | null) {
    const to = lightboxImage.getBoundingClientRect();
    if (!from || !to.width || !to.height) {
      lightbox.dataset.visible = 'true';
      return;
    }
    lightboxImage.style.transition = 'none';
    lightboxImage.style.transform = thumbTransform(from, to);
    // Force the start state to be applied before transitioning away from it.
    void lightboxImage.offsetWidth;
    lightboxImage.style.transition = 'transform var(--lightbox-transition-duration) var(--lightbox-easing)';
    lightboxImage.style.transform = '';
    lightbox.dataset.visible = 'true';
  }

  function updateZoomState(reset = false) {
    if (reset) setZoom(false);
    const fits = lightboxImage.naturalWidth > lightboxImage.clientWidth + 4
      || lightboxImage.naturalHeight > lightboxImage.clientHeight + 4;
    lightbox.dataset.zoomable = fits ? 'true' : 'false';
  }

  function setZoom(on: boolean) {
    isZoomed = on && lightbox.dataset.zoomable === 'true';
    lightbox.dataset.zoomed = isZoomed ? 'true' : 'false';
    if (isZoomed) {
      lightboxImage.style.width = `${lightboxImage.naturalWidth}px`;
      lightboxImage.style.height = `${lightboxImage.naturalHeight}px`;
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
    } else {
      lightboxImage.style.width = '';
      lightboxImage.style.height = '';
    }
    positionCaption();
  }

  /** Sit the caption under the image, or over its foot when there is no room. */
  function positionCaption() {
    if (isZoomed || !lightboxCaption.textContent?.trim()) {
      lightboxCaption.style.display = 'none';
      return;
    }
    lightboxCaption.style.display = '';
    // offset* rather than a client rect: the opening zoom transform must not be
    // mistaken for the image's resting box.
    const bottom = lightboxImage.offsetTop + lightboxImage.offsetHeight;
    const centre = lightboxImage.offsetLeft + lightboxImage.offsetWidth / 2;
    const height = lightboxCaption.offsetHeight;
    const room = window.innerHeight - bottom;
    lightboxCaption.dataset.overlap = room >= height ? 'false' : 'true';
    lightboxCaption.style.top = `${room >= height ? bottom : Math.max(0, bottom - height)}px`;
    lightboxCaption.style.left = `${centre}px`;
  }

  function showLightbox(index: number, opening = false) {
    if (index < 0 || index >= currentGalleryImages.length) return;

    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    }

    currentIndex = index;
    const image = currentGalleryImages[index] as HTMLElement;
    const imageUrl = image.dataset.galleryUrl || image.getAttribute('href') || image.getAttribute('src') || '';
    const imageAlt = image.dataset.galleryAlt || image.getAttribute('alt') || '';
    const imageCaption = image.dataset.galleryCaption || '';

    const text = (value: string) => (value && value !== 'undefined' ? value.trim() : '');
    lightboxTitle.textContent = text(imageAlt);
    lightboxCaptionText.textContent = text(imageCaption);

    downloadBtn.href = imageUrl;
    counter.textContent = `${index + 1} / ${currentGalleryImages.length}`;
    lightbox.dataset.single = currentGalleryImages.length <= 1 ? 'true' : 'false';
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === currentGalleryImages.length - 1;

    const from = opening ? thumbRectOf(index) : null;
    lightboxImage.style.transition = 'none';
    lightboxImage.style.transform = '';
    lightboxImage.src = imageUrl;
    lightboxImage.alt = text(imageAlt);

    isOpen = true;
    lightbox.dataset.open = 'true';
    document.body.style.overflow = 'hidden';

    const onReady = () => {
      updateZoomState(true);
      if (opening) animateFromThumb(from);
      else lightbox.dataset.visible = 'true';
      // The image box only settles after the open transition, and the caption
      // sits against its bottom edge.
      window.setTimeout(positionCaption, 0);
      lightboxImage.addEventListener('transitionend', positionCaption, { once: true });
    };

    if (lightboxImage.complete && lightboxImage.naturalWidth) onReady();
    else lightboxImage.addEventListener('load', onReady, { once: true });
  }

  function hideLightbox() {
    if (!isOpen) return;
    isOpen = false;

    setZoom(false);
    const from = thumbRectOf(currentIndex);
    const to = lightboxImage.getBoundingClientRect();
    lightbox.dataset.visible = 'false';

    const inView = from && from.bottom > 0 && from.top < window.innerHeight;
    if (inView && to.width && to.height) {
      lightboxImage.style.transition = 'transform var(--lightbox-transition-duration) var(--lightbox-easing)';
      lightboxImage.style.transform = thumbTransform(from, to);
    }

    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      lightbox.dataset.open = 'false';
      lightboxImage.style.transition = 'none';
      lightboxImage.style.transform = '';
      lightboxImage.removeAttribute('src');
      document.body.style.overflow = '';
    }, 340);
  }

  function showNext() {
    if (currentIndex < currentGalleryImages.length - 1) showLightbox(currentIndex + 1);
  }

  function showPrev() {
    if (currentIndex > 0) showLightbox(currentIndex - 1);
  }

  closeBtn?.addEventListener('click', hideLightbox);

  zoomBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setZoom(!isZoomed);
  });

  // Clicking the photo itself closes, matching how photo galleries behave.
  lightboxImage.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isZoomed) setZoom(false);
    else hideLightbox();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || (e.target as HTMLElement).classList.contains('gallery-lightbox__viewport')) {
      hideLightbox();
    }
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });

  // Drag to pan while zoomed in.
  let panFrom: { x: number; y: number; left: number; top: number } | null = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (!isZoomed) return;
    panFrom = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!panFrom) return;
    viewport.scrollLeft = panFrom.left - (e.clientX - panFrom.x);
    viewport.scrollTop = panFrom.top - (e.clientY - panFrom.y);
  });
  const endPan = () => { panFrom = null; };
  viewport.addEventListener('pointerup', endPan);
  viewport.addEventListener('pointercancel', endPan);

  window.addEventListener('resize', () => {
    if (!isOpen) return;
    updateZoomState();
    positionCaption();
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'Escape':
        hideLightbox();
        break;
      case 'ArrowRight':
        e.preventDefault();
        showNext();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        showPrev();
        break;
    }
  });
}

function handleAccordionClick(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  
  const triggerButton = e.currentTarget as HTMLButtonElement;
  
  if (!triggerButton) {
    return;
  }
  
  const accordionItem = triggerButton.closest('[data-slot="accordion-item"]') as HTMLElement;
  const accordion = triggerButton.closest('[data-slot="accordion"]') as HTMLElement;
  
  if (!accordionItem || !accordion) {
    return;
  }
  
  const behavior = accordion.getAttribute('data-behavior') || 'single';
  const allowMultiple = behavior === 'multiple';
  const isCurrentlyActive = accordionItem.classList.contains('active');
  const titleSpan = triggerButton.querySelector('.accordion-title') as HTMLElement;
  
  // Handle alwaysOpen behavior - no interaction allowed
  if (behavior === 'alwaysOpen') {
    return;
  }
  
  // If clicking on an already active item, always close it (except for alwaysOpen)
  if (isCurrentlyActive) {
    accordionItem.classList.remove('active');
    triggerButton.setAttribute('aria-expanded', 'false');
    if (titleSpan && !allowMultiple) {
      titleSpan.classList.remove('font-bold');
      titleSpan.classList.add('font-medium');
    }
    return;
  }
  
  // If we get here, we're opening an inactive item
  if (!allowMultiple) {
    // Close all other accordion items first
    const allItems = accordion.querySelectorAll('[data-slot="accordion-item"]');
    
    allItems.forEach((item, index) => {
      if (item !== accordionItem) {
        item.classList.remove('active');
        const itemTrigger = item.querySelector('.accordion-trigger') as HTMLButtonElement;
        const itemTitleSpan = itemTrigger?.querySelector('.accordion-title') as HTMLElement;
        if (itemTrigger) {
          itemTrigger.setAttribute('aria-expanded', 'false');
        }
        if (itemTitleSpan) {
          itemTitleSpan.classList.remove('font-bold');
          itemTitleSpan.classList.add('font-medium');
        }
      }
    });
  }
  
  // Open the current item
  accordionItem.classList.add('active');
  triggerButton.setAttribute('aria-expanded', 'true');
  if (titleSpan && !allowMultiple) {
    titleSpan.classList.remove('font-medium');
    titleSpan.classList.add('font-bold');
  }
}

function handleAccordionKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAccordionClick(e);
  }
}

/**
 * Lay every justified gallery out in rows that are filled to the container
 * width, each image keeping its own proportions (the algorithm photo galleries
 * have used for years — see justifiedLayout). Ratios are read from the images
 * themselves, so the layout is redone as they load and on resize.
 */
function initJustifiedGalleries() {
  const galleries = document.querySelectorAll<HTMLElement>('.gallery.justified');
  galleries.forEach((gallery) => attachJustifiedGallery(gallery));
}

const DEFAULT_ITEM_RATIO = 1.5;
const DEFAULT_ROW_HEIGHT = 288;
const DEFAULT_SPACING = 8;

function attachJustifiedGallery(gallery: HTMLElement) {
  const items = Array.from(gallery.querySelectorAll<HTMLElement>('.gallery-item'));
  if (!items.length) return;

  const readRatios = () =>
    items.map((item) => {
      const img = item.querySelector('img');
      if (!img) return DEFAULT_ITEM_RATIO;
      // Width/height attributes are known up front; naturalWidth is the
      // reliable runtime signal (a cached image reports it while `complete` is
      // still false, and then never fires `load` again).
      const attrRatio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
      if (Number.isFinite(attrRatio) && attrRatio > 0) return attrRatio;
      if (img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
      return DEFAULT_ITEM_RATIO;
    });

  const numberFromStyle = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  let lastKey = '';

  const layout = () => {
    const rowWidth = gallery.getBoundingClientRect().width;
    if (!rowWidth) return;

    const ratios = readRatios();
    const styles = getComputedStyle(gallery);
    const spacing = numberFromStyle(styles.columnGap, DEFAULT_SPACING);
    const rowHeight = numberFromStyle(
      styles.getPropertyValue('--gallery-row-height'),
      DEFAULT_ROW_HEIGHT
    );

    // Nothing measurable changed: skip the write to avoid resize/load loops.
    const key = [rowWidth, spacing, rowHeight, ...ratios].join('|');
    if (key === lastKey) return;
    lastKey = key;

    const { containerHeight, boxes } = justifiedLayout(ratios, {
      rowWidth,
      rowHeight,
      spacing,
      heightTolerance: 0.25,
    });

    items.forEach((item, index) => {
      const box = boxes[index];
      if (!box) return;
      item.style.top = `${box.top}px`;
      item.style.left = `${box.left}px`;
      item.style.width = `${box.width}px`;
      item.style.height = `${box.height}px`;
    });

    gallery.style.height = `${containerHeight}px`;
    // Only now are the boxes positioned; before this the CSS fallback applies.
    gallery.classList.add('is-justified');
  };

  layout();

  if (gallery.dataset.justifiedBound === 'true') return;
  gallery.dataset.justifiedBound = 'true';

  let frame = 0;
  const scheduleLayout = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      layout();
    });
  };

  items.forEach((item) => {
    const img = item.querySelector('img');
    if (img) img.addEventListener('load', scheduleLayout);
  });

  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('orientationchange', scheduleLayout);
}

if (typeof window !== 'undefined') {
  (window as any).PRSSUIClient = {
    initCodeBlockCopyFunctionality,
    initGalleryLightbox,
    initJustifiedGalleries,
    initCarouselNavigation,
    initBlockAnimations,
    initAccordionEventListeners,
    initEmbedBlocks,
    handleAccordionClick,
    handleAccordionKeydown
  };
}
