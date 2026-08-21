import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface ThemeOption {
  id: string;
  name: string;
  emoji: string;
  background: string;
  description: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'spring',
    name: '春日暖阳',
    emoji: '🌸',
    background: `
      radial-gradient(ellipse at 20% 50%, rgba(255, 182, 193, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(173, 216, 230, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(255, 218, 185, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fef5f6 0%, #f0f7f4 50%, #fef9e7 100%)
    `,
    description: '粉蓝暖橙，温柔清新',
  },
  {
    id: 'ocean',
    name: '海洋之心',
    emoji: '🌊',
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(99, 179, 237, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 70%, rgba(129, 230, 217, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(183, 148, 244, 0.08) 0%, transparent 50%),
      linear-gradient(135deg, #ebf8ff 0%, #e6fffa 50%, #f0f4ff 100%)
    `,
    description: '海蓝薄荷，清凉宁静',
  },
  {
    id: 'sunset',
    name: '落日余晖',
    emoji: '🌅',
    background: `
      radial-gradient(ellipse at 20% 30%, rgba(251, 146, 60, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 60%, rgba(244, 114, 182, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 90%, rgba(253, 224, 71, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fff7ed 0%, #fef2f2 50%, #fefce8 100%)
    `,
    description: '橙粉金黄，温暖浪漫',
  },
  {
    id: 'forest',
    name: '森林秘境',
    emoji: '🌿',
    background: `
      radial-gradient(ellipse at 25% 40%, rgba(74, 166, 126, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 70%, rgba(132, 204, 160, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 20%, rgba(187, 222, 195, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #f0f7f4 0%, #ecfdf5 50%, #f0fdf4 100%)
    `,
    description: '翠绿青碧，自然生机',
  },
  {
    id: 'lavender',
    name: '薰衣草田',
    emoji: '💜',
    background: `
      radial-gradient(ellipse at 30% 30%, rgba(167, 139, 250, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 60%, rgba(236, 167, 244, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(196, 181, 253, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #faf5ff 0%, #fdf4ff 50%, #f5f3ff 100%)
    `,
    description: '紫罗兰粉，梦幻优雅',
  },
  {
    id: 'peach',
    name: '蜜桃甜心',
    emoji: '🍑',
    background: `
      radial-gradient(ellipse at 20% 40%, rgba(251, 113, 133, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 30%, rgba(253, 186, 116, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 70%, rgba(249, 168, 212, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fff1f2 0%, #fef3c7 50%, #fce7f3 100%)
    `,
    description: '桃粉蜜橙，甜美可人',
  },
];

interface ThemeContextType {
  currentTheme: ThemeOption;
  setThemeById: (id: string) => void;
  customBgUrl: string | null;
  setCustomBg: (dataUrl: string) => void;
  clearCustomBg: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: THEMES[0],
  setThemeById: () => {},
  customBgUrl: null,
  setCustomBg: () => {},
  clearCustomBg: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('our-space-theme') || THEMES[0].id;
  });

  const [customBgUrl, setCustomBgUrl] = useState<string | null>(() => {
    return localStorage.getItem('our-space-custom-bg');
  });

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  const applyBackground = useCallback(() => {
    if (customBgUrl) {
      document.body.style.background = `url(${customBgUrl}) center/cover no-repeat fixed`;
    } else {
      document.body.style.background = currentTheme.background;
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [customBgUrl, currentTheme]);

  useEffect(() => {
    localStorage.setItem('our-space-theme', themeId);
    applyBackground();
  }, [themeId, applyBackground]);

  const setThemeById = (id: string) => {
    setCustomBgUrl(null);
    localStorage.removeItem('our-space-custom-bg');
    setThemeId(id);
  };

  const setCustomBg = (dataUrl: string) => {
    setCustomBgUrl(dataUrl);
    localStorage.setItem('our-space-custom-bg', dataUrl);
  };

  const clearCustomBg = () => {
    setCustomBgUrl(null);
    localStorage.removeItem('our-space-custom-bg');
    applyBackground();
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setThemeById, customBgUrl, setCustomBg, clearCustomBg }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
