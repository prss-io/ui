document.addEventListener('click', function(e) {
  const target = e.target as HTMLElement;
  
  const accordionTrigger = target.closest('[data-accordion-trigger]');
  if (accordionTrigger) {
    handleAccordionClick(e);
  }
});

document.addEventListener('keydown', function(e) {
  const target = e.target as HTMLElement;
  
  const accordionTrigger = target.closest('[data-accordion-trigger]');
  if (accordionTrigger) {
    handleAccordionKeydown(e);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  initCodeBlockCopyFunctionality();
  initGalleryLightbox();
  initCarouselNavigation();
  initBlockAnimations();
});

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
  
  const lightboxImage = lightbox.querySelector('.gallery-lightbox-image') as HTMLImageElement;
  const lightboxCaption = lightbox.querySelector('.gallery-lightbox-caption') as HTMLElement;
  const lightboxTitle = lightbox.querySelector('.gallery-lightbox-title') as HTMLElement;
  const lightboxCaptionText = lightbox.querySelector('.gallery-lightbox-caption-text') as HTMLElement;
  const closeBtn = lightbox.querySelector('.gallery-lightbox-close') as HTMLElement;
  const prevBtn = lightbox.querySelector('.gallery-lightbox-prev') as HTMLElement;
  const nextBtn = lightbox.querySelector('.gallery-lightbox-next') as HTMLElement;
  
  let currentIndex = 0;
  let currentGalleryImages: NodeListOf<Element>;
  
  // Use event delegation to handle all images with data-action="zoom"
  document.addEventListener('click', function(e) {
    const target = e.target as HTMLElement;
    
    // Check if the clicked element is an image with data-action="zoom"
    if (target.tagName === 'IMG' && target.getAttribute('data-action') === 'zoom') {
      e.preventDefault();
      
      const clickedImage = target as HTMLImageElement;
      const galleryBox = clickedImage.closest('.gallery-box');
      
      if (galleryBox) {
        // If image is in a gallery, show all gallery images
        currentGalleryImages = galleryBox.querySelectorAll('img[data-action="zoom"]');
        currentIndex = Array.from(currentGalleryImages).indexOf(clickedImage);
      } else {
        // If image is standalone, show all zoomable images on the page
        currentGalleryImages = document.querySelectorAll('img[data-action="zoom"]');
        currentIndex = Array.from(currentGalleryImages).indexOf(clickedImage);
      }
      
      showLightbox(currentIndex);
    }
  });
  
  function createLightboxModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'gallery-lightbox';
    modal.className = 'gallery-lightbox fixed inset-0 bg-black bg-opacity-90 items-center justify-center p-4';
    modal.style.zIndex = '9999';
    modal.style.display = 'none';
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
  
  function showLightbox(index: number) {
    if (index < 0 || index >= currentGalleryImages.length) return;
    
    currentIndex = index;
    const image = currentGalleryImages[index] as HTMLElement;
    const imageUrl = image.dataset.galleryUrl || image.getAttribute('src') || '';
    const imageAlt = image.dataset.galleryAlt || image.getAttribute('alt') || '';
    const imageCaption = image.dataset.galleryCaption || '';
    
    lightboxImage.src = imageUrl;
    lightboxImage.alt = imageAlt;
    
    if (imageAlt && lightboxTitle) {
      lightboxTitle.textContent = imageAlt;
      lightboxTitle.style.display = 'block';
    } else {
      lightboxTitle.style.display = 'none';
    }
    
    if (imageCaption && imageCaption.trim() !== '' && lightboxCaptionText) {
      lightboxCaptionText.textContent = imageCaption;
      lightboxCaptionText.style.display = 'block';
    } else {
      lightboxCaptionText.style.display = 'none';
    }
    
    const hasTitle = imageAlt && imageAlt.trim() !== '';
    const hasCaption = imageCaption && imageCaption.trim() !== '';
    
    if (hasTitle || hasCaption) {
      lightboxCaption.style.display = 'block';
    } else {
      lightboxCaption.style.display = 'none';
    }
    
    if (currentGalleryImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
    
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  function hideLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  function showNext() {
    const nextIndex = (currentIndex + 1) % currentGalleryImages.length;
    showLightbox(nextIndex);
  }
  
  function showPrev() {
    const prevIndex = (currentIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    showLightbox(prevIndex);
  }
  
  closeBtn?.addEventListener('click', hideLightbox);
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
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
  
  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display !== 'none' && lightbox.style.display !== '') {
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

function handleAccordionClick(e: Event) {
  const target = e.target as HTMLElement;
  const triggerButton = target.closest('[data-accordion-trigger]') as HTMLButtonElement;
  
  if (!triggerButton) {
    return;
  }
  
  const accordionItem = triggerButton.closest('[data-slot="accordion-item"]') as HTMLElement;
  const accordion = triggerButton.closest('[data-slot="accordion"]') as HTMLElement;
  
  if (!accordionItem || !accordion) {
    return;
  }
  
  const allowMultiple = accordion.getAttribute('data-allow-multiple') === 'true';
  const isCurrentlyActive = accordionItem.classList.contains('active');
  const titleSpan = triggerButton.querySelector('.accordion-title') as HTMLElement;
  
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
  
  accordionItem.classList.add('active');
  triggerButton.setAttribute('aria-expanded', 'true');
  if (titleSpan) {
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

if (typeof window !== 'undefined') {
  (window as any).PRSSUIClient = {
    initCodeBlockCopyFunctionality,
    initGalleryLightbox,
    initCarouselNavigation,
    initBlockAnimations,
    handleAccordionClick,
    handleAccordionKeydown
  };
}
