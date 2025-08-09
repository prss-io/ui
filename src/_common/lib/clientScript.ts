// PRSS UI Client Script
// This script provides interactive functionality for PRSS UI components

// Initialize all components on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initCodeBlockCopyFunctionality();
  initGalleryLightbox();
  initCarouselNavigation();
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

// Export for potential external use
if (typeof window !== 'undefined') {
  (window as any).PRSSUIClient = {
    initCodeBlockCopyFunctionality,
    initGalleryLightbox,
    initCarouselNavigation
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
