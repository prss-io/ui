import React from 'react';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationDirection?: string;
  animationEasing?: string;
  animationIterations?: string;
  animationTrigger?: string;
  style?: React.CSSProperties;
  className?: string;
}

const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animationType = 'none',
  animationDuration = 1,
  animationDelay = 0,
  animationDirection = 'normal',
  animationEasing = 'ease-in-out',
  animationIterations = '1',
  animationTrigger = 'onVisible',
  style,
  className
}) => {
  // Don't animate if no animation type is specified or it's 'none'
  if (!animationType || animationType === 'none') {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    );
  }

  // Define which animations should start hidden and use forwards fill
  const entranceAnimations = [
    'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight',
    'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight',
    'scaleIn', 'zoomIn', 'rotateIn', 'bounceIn'
  ];

  // Define which animations should loop and start visible
  const continuousAnimations = ['pulse', 'wobble', 'shake'];

  const isEntranceAnimation = entranceAnimations.includes(animationType);
  const isContinuousAnimation = continuousAnimations.includes(animationType);

  // Determine appropriate fill mode
  let fillMode = 'both';
  if (isEntranceAnimation && animationIterations !== 'infinite') {
    fillMode = 'forwards'; // Hold final state for entrance animations
  } else if (isContinuousAnimation) {
    fillMode = 'none'; // Don't hold state for continuous animations
  }

  // Build animation styles
  const animationStyles: React.CSSProperties = {
    ...style,
    animationName: animationType,
    animationDuration: `${animationDuration}s`,
    animationDelay: `${animationDelay}s`,
    animationDirection: animationDirection as any,
    animationTimingFunction: animationEasing,
    animationIterationCount: animationIterations === 'infinite' ? 'infinite' : animationIterations,
    animationFillMode: fillMode
  };

  // For entrance animations that should start hidden
  if (isEntranceAnimation && (animationTrigger === 'onVisible' || animationTrigger === 'onScroll')) {
    animationStyles.opacity = 0;
  }

  // Build CSS classes
  const cssClasses = [
    'prss-animate',
    `animate-${animationTrigger.toLowerCase()}`,
    isEntranceAnimation ? 'entrance-animation' : '',
    isContinuousAnimation ? 'continuous-animation' : '',
    className
  ].filter(Boolean).join(' ');

  // Add data attributes for client-side animation handling
  const dataAttributes = {
    'data-animation-type': animationType,
    'data-animation-trigger': animationTrigger,
    'data-animation-duration': animationDuration.toString(),
    'data-animation-delay': animationDelay.toString(),
    'data-animation-easing': animationEasing,
    'data-animation-iterations': animationIterations,
    'data-animation-direction': animationDirection,
    'data-animation-category': isEntranceAnimation ? 'entrance' : isContinuousAnimation ? 'continuous' : 'other'
  };

  // For onLoad animations, apply styles immediately
  if (animationTrigger === 'onLoad') {
    return (
      <div 
        style={animationStyles} 
        className={cssClasses}
        {...dataAttributes}
      >
        {children}
      </div>
    );
  }

  // Determine initial style based on animation type and trigger
  let initialStyle = { ...style };

  if (isEntranceAnimation) {
    // Entrance animations: start hidden for scroll/visible triggers, visible for interactive triggers
    if (animationTrigger === 'onVisible' || animationTrigger === 'onScroll') {
      initialStyle.opacity = 0;
    } else {
      // For hover/click, start visible but will animate from hidden state when triggered
      initialStyle.opacity = 1;
    }
  } else if (isContinuousAnimation) {
    // Continuous animations: always start visible
    initialStyle.opacity = 1;
  } else {
    // Other animations: start visible
    initialStyle.opacity = 1;
  }

  // For other triggers, let client-side script handle it
  return (
    <div 
      style={initialStyle} 
      className={cssClasses}
      {...dataAttributes}
    >
      {children}
    </div>
  );
};

export default AnimatedWrapper;
