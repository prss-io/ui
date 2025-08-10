// PRSS UI Client Script
// This script provides interactive functionality for PRSS UI components

// Initialize all components on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initCodeBlockCopyFunctionality();
  initGalleryLightbox();
  initCarouselNavigation();
  initBlockAnimations();
  initAccordionFunctionality();
});

// All images under .post-inner-content should have data-action="zoom", unless they have a class of "no-zoom" or data-action="none"
// Only images with width and height over 500px should be zoomable
document.querySelectorAll(".post-inner-content img")?.forEach((img) => {
  if (img && !img.classList.contains("no-zoom") && img.getAttribute("data-action") !== "none") {
    // Create a new image element to get actual dimensions
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
  // Find all code block copy buttons
  const copyButtons = document.querySelectorAll('.code-block__copy-button');
  
  copyButtons.forEach(button => {
    const buttonElement = button as HTMLButtonElement;
    buttonElement.addEventListener('click', async function() {
      const codeBlock = buttonElement.closest('.code-block');
      if (!codeBlock) return;
      
      // Find the code content
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;
      
      // Get the text content, removing any syntax highlighting HTML
      let codeText = '';
      
      // Check if it's a line-numbered code block
      const codeLines = codeElement.querySelectorAll('.code-line');
      if (codeLines.length > 0) {
        // Extract text from each line, ignoring line numbers
        codeText = Array.from(codeLines).map(line => {
          const lineContent = line.querySelector('.line-content');
          return lineContent ? lineContent.textContent || '' : '';
        }).join('\n');
      } else {
        // Regular code block without line numbers
        codeText = codeElement.textContent || '';
      }
      
      try {
        await navigator.clipboard.writeText(codeText);
        
        // Update button state to show success with icon switching
        const copyIcon = buttonElement.querySelector('.copy-icon');
        const copiedIcon = buttonElement.querySelector('.copied-icon');
        
        if (copyIcon && copiedIcon) {
          // Hide copy icon, show check icon
          copyIcon.classList.add('hidden');
          copiedIcon.classList.remove('hidden');
          
          // Update button styling for success state
          const originalClasses = buttonElement.className;
          buttonElement.className = buttonElement.className.replace(
            /bg-\w+-\d+|text-\w+-\d+|border-\w+-\d+/g, 
            ''
          ).trim() + ' bg-green-100 text-green-800 border-green-300';
          buttonElement.title = 'Copied!';
          buttonElement.setAttribute('data-copy-state', 'copied');
          
          // Reset after 2 seconds
          setTimeout(() => {
            buttonElement.className = originalClasses;
            buttonElement.title = 'Copy code';
            buttonElement.setAttribute('data-copy-state', 'idle');
            copyIcon.classList.remove('hidden');
            copiedIcon.classList.add('hidden');
          }, 2000);
        }
        
      } catch (err) {
        console.error('Failed to copy code:', err);
        
        // Fallback: try to select the text for manual copying
        try {
          const range = document.createRange();
          range.selectNodeContents(codeElement);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (selectErr) {
          console.error('Failed to select code for manual copying:', selectErr);
        }
      }
    });
  });
}

// Block Animations Functionality
function initBlockAnimations() {
  // Inject animation CSS if not already present
  if (!document.getElementById('prss-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'prss-animation-styles';
    style.textContent = getAnimationCSS();
    document.head.appendChild(style);
  }

  // Find all animated blocks
  const animatedBlocks = document.querySelectorAll('.prss-animate');
  
  // Set up intersection observer for scroll-triggered animations
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
    
    // Initialize animation state
    element.dataset.animationState = 'idle';
    
    switch (trigger) {
      case 'onLoad':
        // Animation should already be applied via CSS
        break;
        
      case 'onVisible':
      case 'onScroll':
        observer.observe(element);
        break;
        
      case 'onHover':
        element.addEventListener('mouseenter', () => {
          // Prevent spam hovering - check if animation is already running
          if (element.dataset.animationState === 'running') {
            return;
          }
          triggerAnimation(element);
        });
        element.addEventListener('mouseleave', () => {
          const category = element.dataset.animationCategory;
          const iterations = element.dataset.animationIterations || '1';
          
          // Only reset if it's not an infinite animation and not currently running
          if (iterations !== 'infinite' && element.dataset.animationState !== 'running') {
            if (category === 'continuous') {
              // Stop continuous animations on mouse leave
              resetAnimation(element);
            } else if (category === 'entrance') {
              // For entrance animations, keep element visible but allow re-trigger
              resetAnimation(element);
            } else {
              // For other animations, normal reset behavior
              resetAnimation(element);
            }
          }
        });
        break;
        
      case 'onClick':
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => {
          const iterations = element.dataset.animationIterations || '1';
          
          // Prevent spam clicking - check if animation is already running
          if (element.dataset.animationState === 'running') {
            return;
          }
          
          triggerAnimation(element);
          
          // Reset after animation completes (only for non-infinite animations)
          if (iterations !== 'infinite') {
            const duration = parseFloat(element.dataset.animationDuration || '1') * 1000;
            const delay = parseFloat(element.dataset.animationDelay || '0') * 1000;
            setTimeout(() => {
              resetAnimation(element);
            }, duration + delay + 100); // Add small buffer
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
  
  // Check if animation is already running - prevent spam
  if (element.classList.contains('prss-animated') && element.dataset.animationState === 'running') {
    return; // Animation already running, ignore new trigger
  }
  
  if (animationType && animationType !== 'none') {
    // Mark animation as running
    element.dataset.animationState = 'running';
    
    // Clear any existing animation
    element.style.animationName = 'none';
    
    // Force reflow
    element.offsetHeight;
    
    // Smart initial state handling based on trigger and animation type
    if (category === 'entrance') {
      // For entrance animations, behavior depends on trigger type
      if (trigger === 'onVisible' || trigger === 'onScroll') {
        // For scroll-based triggers, start hidden (traditional entrance effect)
        if (animationType.includes('fade') || animationType.includes('scale') || animationType.includes('zoom') || animationType.includes('bounce') || animationType.includes('rotate')) {
          element.style.opacity = '0';
        }
      } else if (trigger === 'onHover' || trigger === 'onClick') {
        // For interactive triggers, only hide if it's specifically a fade animation
        // Scale, zoom, rotate effects should start visible for better UX
        if (animationType.includes('fade') && !animationType.includes('scale') && !animationType.includes('zoom') && !animationType.includes('rotate')) {
          element.style.opacity = '0';
        } else {
          // For scale, zoom, rotate animations on hover/click, start visible
          element.style.opacity = '1';
        }
      } else {
        // For other triggers (onLoad), start visible
        element.style.opacity = '1';
      }
      
      // Force reflow after setting initial state
      element.offsetHeight;
    } else if (category === 'continuous') {
      // For continuous animations, always stay visible
      element.style.opacity = '1';
      element.offsetHeight;
    }
    
    // Determine appropriate fill mode based on animation category
    let fillMode = 'both';
    if (category === 'entrance' && iterations !== 'infinite') {
      fillMode = 'forwards'; // Hold final state for entrance animations
    } else if (category === 'continuous') {
      fillMode = 'none'; // Don't hold state for continuous animations
    }
    
    // Apply animation with smart animation type selection for better UX
    let finalAnimationType = animationType;
    
    // For interactive triggers, use more UX-friendly animation variants
    if (trigger === 'onHover' || trigger === 'onClick') {
      switch (animationType) {
        case 'scaleIn':
          finalAnimationType = 'scaleUp'; // Scale up from normal size instead of from 0
          break;
        case 'zoomIn':
          finalAnimationType = 'zoomUp'; // Subtle zoom instead of dramatic zoom
          break;
        case 'rotateIn':
          finalAnimationType = Math.random() > 0.5 ? 'rotateLeft' : 'rotateRight'; // Subtle rotation
          break;
        // Keep original animations for truly entrance-style effects
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
    
    // Mark as animated
    element.classList.add('prss-animated');
    
    // Calculate total animation duration
    const totalDuration = (parseFloat(duration) + parseFloat(delay)) * 1000;
    
    // Set up animation completion handler
    const handleAnimationEnd = () => {
      // Mark animation as complete
      element.dataset.animationState = 'complete';
      
      // For entrance animations, ensure they stay visible after completion
      if (category === 'entrance' && iterations !== 'infinite') {
        // After animation completes, ensure element stays visible
        element.style.opacity = '1';
        element.style.transform = "initial";
      }
    };
    
    // For non-infinite animations, set completion timer
    if (iterations !== 'infinite') {
      setTimeout(handleAnimationEnd, totalDuration);
    }
    
    // For entrance animations, ensure they stay visible after completion
    if (category === 'entrance' && iterations !== 'infinite') {
      const totalDuration = (parseFloat(duration) + parseFloat(delay)) * 1000;
      
      setTimeout(() => {
        // After animation completes, ensure element stays visible
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
  
  // Don't reset infinite animations
  if (iterations === 'infinite') return;
  
  // Clear animation state
  element.dataset.animationState = 'idle';
  
  // Clear animation
  element.style.animationName = 'none';
  element.offsetHeight; // Force reflow
  
  // Reset classes
  element.classList.remove('prss-animated');
  
  // Handle different animation categories and triggers differently
  if (trigger === 'onHover') {
    if (category === 'entrance') {
      // For entrance animations on hover, reset to normal visible state
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
    } else if (category === 'continuous') {
      // For continuous animations, ensure they're visible
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
    }
  } else if (trigger === 'onClick') {
    if (category === 'entrance') {
      // For entrance animations on click, reset to normal visible state
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
    } else if (category === 'continuous') {
      // For continuous animations, ensure they're visible
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
    }
  } else {
    // For scroll/visible triggers, keep the animated state
    if (category === 'entrance') {
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
    } else if (category === 'continuous') {
      element.style.opacity = '1';
      // Don't force transform: none, let CSS handle it
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

/* Interactive-friendly variations that don't change opacity */
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

/* Base animation class */
.prss-animate {
  /* Default to visible, individual categories will override as needed */
  opacity: 1;
  /*transform: none;*/
}

/* Entrance animations start hidden for scroll-based triggers */
.prss-animate.entrance-animation.animate-onvisible:not(.prss-animated),
.prss-animate.entrance-animation.animate-onscroll:not(.prss-animated) {
  opacity: 0;
}

/* Continuous animations always start visible */
.prss-animate.continuous-animation {
  opacity: 1;
}

/* Ensure elements with forwards fill mode stay in final state - but don't override transforms during animation */
.prss-animate.prss-animated.entrance-animation {
  opacity: 1 !important;
}
`;
}

// Export for potential external use
if (typeof window !== 'undefined') {
  (window as any).PRSSUIClient = {
    initCodeBlockCopyFunctionality,
    initGalleryLightbox,
    initCarouselNavigation,
    initBlockAnimations
  };
}

// Carousel Navigation Functionality
function initCarouselNavigation() {
  // Find all carousel galleries
  const carouselContainers = document.querySelectorAll('.gallery-box.carousel-container');
  
  carouselContainers.forEach(container => {
    const gallery = container.querySelector('.gallery.carousel') as HTMLElement;
    const prevBtn = container.querySelector('.carousel-nav.prev') as HTMLButtonElement;
    const nextBtn = container.querySelector('.carousel-nav.next') as HTMLButtonElement;
    
    if (!gallery || !prevBtn || !nextBtn) {
      console.log('Missing carousel elements:', { gallery: !!gallery, prevBtn: !!prevBtn, nextBtn: !!nextBtn });
      return;
    }
    
    // Calculate scroll amount dynamically
    function getScrollAmount() {
      return gallery.clientWidth * 0.8; // Scroll 80% of container width
    }
    
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Previous button clicked');
      gallery.scrollBy({
        left: -getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Next button clicked');
      gallery.scrollBy({
        left: getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
    // Update button states based on scroll position
    function updateButtonStates() {
      const scrollLeft = gallery.scrollLeft;
      const maxScroll = gallery.scrollWidth - gallery.clientWidth;
      
      prevBtn.disabled = scrollLeft <= 1; // Small threshold for rounding
      nextBtn.disabled = scrollLeft >= maxScroll - 1;
      
      // Visual feedback for disabled state
      prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
      nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
    }
    
    // Initial button state
    setTimeout(updateButtonStates, 100); // Delay to ensure layout is complete
    
    // Update button states on scroll
    gallery.addEventListener('scroll', updateButtonStates);
    
    // Update on resize
    window.addEventListener('resize', updateButtonStates);
  });
}

// Gallery Lightbox Functionality
function initGalleryLightbox() {
  // Find all images with data-action="zoom"
  const zoomableImages = document.querySelectorAll('img[data-action="zoom"]');
  
  if (zoomableImages.length === 0) return;
  
  // Create lightbox modal if it doesn't exist
  let lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) {
    lightbox = createLightboxModal();
    document.body.appendChild(lightbox);
  }
  
  const lightboxImage = lightbox.querySelector('.gallery-lightbox-image') as HTMLImageElement;
  const lightboxCaption = lightbox.querySelector('.gallery-lightbox-caption') as HTMLElement;
  const lightboxTitle = lightbox.querySelector('.gallery-lightbox-title') as HTMLElement;
  const lightboxCaptionText = lightbox.querySelector('.gallery-lightbox-caption-text') as HTMLElement;
  const closeBtn = lightbox.querySelector('.gallery-lightbox-close') as HTMLElement;
  const prevBtn = lightbox.querySelector('.gallery-lightbox-prev') as HTMLElement;
  const nextBtn = lightbox.querySelector('.gallery-lightbox-next') as HTMLElement;
  
  let currentIndex = 0;
  let currentGalleryImages: NodeListOf<Element> = zoomableImages;
  
  // Function to create lightbox modal
  function createLightboxModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'gallery-lightbox';
    modal.className = 'gallery-lightbox fixed inset-0 bg-black bg-opacity-90 hidden items-center justify-center p-4';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div class="gallery-lightbox-content relative max-w-7xl max-h-full">
        <button class="gallery-lightbox-close absolute top-4 right-4 text-white hover:text-gray-300 z-10 w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
          ✕
        </button>
        
        <img class="gallery-lightbox-image max-w-full max-h-full object-contain" src="" alt="">
        
        <div class="gallery-lightbox-caption absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-75 p-4 rounded">
          <h3 class="gallery-lightbox-title text-white text-lg font-semibold mb-2"></h3>
          <p class="gallery-lightbox-caption-text text-white"></p>
        </div>

        <button class="gallery-lightbox-prev absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-xl">
          ◀
        </button>
        <button class="gallery-lightbox-next absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-xl">
          ▶
        </button>
      </div>
    `;
    return modal;
  }
  
  // Function to show lightbox with specific image
  function showLightbox(index: number) {
    if (index < 0 || index >= currentGalleryImages.length) return;
    
    currentIndex = index;
    const image = currentGalleryImages[index] as HTMLElement;
    const imageUrl = image.dataset.galleryUrl || image.getAttribute('src') || '';
    const imageAlt = image.dataset.galleryAlt || image.getAttribute('alt') || '';
    const imageCaption = image.dataset.galleryCaption || '';
    
    lightboxImage.src = imageUrl;
    lightboxImage.alt = imageAlt;
    
    // Show title (use alt as title if available)
    if (imageAlt && lightboxTitle) {
      lightboxTitle.textContent = imageAlt;
      lightboxTitle.style.display = 'block';
    } else {
      lightboxTitle.style.display = 'none';
    }
    
    // Show caption
    if (imageCaption && lightboxCaptionText) {
      lightboxCaptionText.textContent = imageCaption;
      lightboxCaptionText.style.display = 'block';
    } else {
      lightboxCaptionText.style.display = 'none';
    }
    
    // Show caption container if either title or caption exists
    if ((imageAlt && lightboxTitle) || (imageCaption && lightboxCaptionText)) {
      lightboxCaption.classList.remove('hidden');
    } else {
      lightboxCaption.classList.add('hidden');
    }
    
    // Show/hide navigation buttons based on image count
    if (currentGalleryImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
    
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  
  // Function to hide lightbox
  function hideLightbox() {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }
  
  // Function to show next image
  function showNext() {
    const nextIndex = (currentIndex + 1) % currentGalleryImages.length;
    showLightbox(nextIndex);
  }
  
  // Function to show previous image
  function showPrev() {
    const prevIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    showLightbox(prevIndex);
  }
  
  // Add click handlers to zoomable images
  zoomableImages.forEach((image, index) => {
    image.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Find which gallery this image belongs to by checking if it's in a gallery-box
      const galleryBox = image.closest('.gallery-box');
      if (galleryBox) {
        // Get all zoomable images from this specific gallery
        currentGalleryImages = galleryBox.querySelectorAll('img[data-action="zoom"]');
        // Find the index of the clicked image within this gallery
        currentIndex = Array.from(currentGalleryImages).indexOf(image);
      } else {
        // Fallback: use all zoomable images on the page
        currentGalleryImages = zoomableImages;
        currentIndex = index;
      }
      
      showLightbox(currentIndex);
    });
  });
  
  // Close lightbox handlers
  closeBtn?.addEventListener('click', hideLightbox);
  
  // Click outside to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      hideLightbox();
    }
  });
  
  // Navigation handlers
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    showNext();
  });
  
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('hidden')) {
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
    }
  });
}

function initAccordionFunctionality() {
  // Find all accordion blocks
  const accordionBlocks = document.querySelectorAll('[data-slot="accordion"]');
  
  accordionBlocks.forEach(accordion => {
    const triggers = accordion.querySelectorAll('[data-accordion-trigger]');
    const allowMultiple = accordion.getAttribute('data-allow-multiple') === 'true';
    
    triggers.forEach(trigger => {
      const triggerButton = trigger as HTMLButtonElement;
      const accordionItem = triggerButton.closest('[data-slot="accordion-item"]') as HTMLElement;
      
      if (!accordionItem) return;
      
      triggerButton.addEventListener('click', () => {
        const isCurrentlyActive = accordionItem.classList.contains('active');
        const titleSpan = triggerButton.querySelector('.accordion-title') as HTMLElement;
        
        // If multiple accordions are not allowed, close all others first
        if (!allowMultiple) {
          const allItems = accordion.querySelectorAll('[data-slot="accordion-item"]');
          allItems.forEach(item => {
            if (item !== accordionItem) {
              item.classList.remove('active');
              const itemTrigger = item.querySelector('[data-accordion-trigger]') as HTMLButtonElement;
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
        
        // Toggle current accordion
        if (isCurrentlyActive) {
          accordionItem.classList.remove('active');
          triggerButton.setAttribute('aria-expanded', 'false');
          if (titleSpan) {
            titleSpan.classList.remove('font-bold');
            titleSpan.classList.add('font-medium');
          }
        } else {
          accordionItem.classList.add('active');
          triggerButton.setAttribute('aria-expanded', 'true');
          if (titleSpan) {
            titleSpan.classList.remove('font-medium');
            titleSpan.classList.add('font-bold');
          }
        }
      });
      
      // Handle keyboard navigation
      triggerButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerButton.click();
        }
      });
    });
  });
}
