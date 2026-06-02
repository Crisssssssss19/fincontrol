'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export default function ThemeInitializer() {
  const { theme, accentColor, font, borderRadius, density, animations, animationSpeed } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;

    // 1. Theme configuration
    // Clean prior classes that start with theme- or radius- or density- or speed- or accent-
    Array.from(root.classList).forEach((className) => {
      if (
        className.startsWith('theme-') ||
        className.startsWith('radius-') ||
        className.startsWith('density-') ||
        className.startsWith('speed-') ||
        className.startsWith('accent-')
      ) {
        root.classList.remove(className);
      }
    });

    // Apply new style classes
    root.classList.add(`theme-${theme}`);
    root.classList.add(`radius-${borderRadius}`);
    root.classList.add(`density-${density}`);
    root.classList.add(`speed-${animationSpeed}`);
    root.classList.add(`accent-${accentColor}`);

    // 2. Animations toggling
    if (!animations) {
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.removeProperty('--transition-duration');
    }

    // 3. Typographical primary font
    root.style.setProperty('--font-sans', font);
    root.style.fontFamily = `"${font}", var(--font-sans), sans-serif`;

  }, [theme, accentColor, font, borderRadius, density, animations, animationSpeed, mounted]);

  return null;
}
