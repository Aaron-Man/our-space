import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';

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
    emoji: '',
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
  {
    id: 'sakura',
    name: '樱花飞舞',
    emoji: '🌸',
    background: `
      radial-gradient(ellipse at 15% 30%, rgba(255, 183, 197, 0.2) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 70%, rgba(255, 223, 238, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(255, 240, 245, 0.1) 0%, transparent 40%),
      linear-gradient(180deg, #fff5f7 0%, #ffe8ef 50%, #ffd6e0 100%)
    `,
    description: '粉樱飘散，诗意浪漫',
  },
  {
    id: 'moonlight',
    name: '月下清风',
    emoji: '',
    background: `
      radial-gradient(ellipse at 50% 20%, rgba(255, 255, 220, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 80%, rgba(200, 220, 255, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 60%, rgba(180, 200, 240, 0.1) 0%, transparent 50%),
      linear-gradient(to bottom, #f0f4f8 0%, #e8edf5 50%, #dfe6f0 100%)
    `,
    description: '月白风清，静谧安详',
  },
  {
    id: 'autumn',
    name: '秋叶静美',
    emoji: '🍂',
    background: `
      radial-gradient(ellipse at 20% 40%, rgba(255, 160, 80, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 60%, rgba(255, 140, 100, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(255, 200, 120, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fff8f0 0%, #ffeedd 50%, #ffe5cc 100%)
    `,
    description: '金桂飘香，温润如玉',
  },
  {
    id: 'starry',
    name: '星河璀璨',
    emoji: '✨',
    background: `
      radial-gradient(ellipse at 50% 30%, rgba(255, 255, 200, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 20% 70%, rgba(200, 180, 255, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 50%, rgba(180, 200, 255, 0.1) 0%, transparent 50%),
      linear-gradient(to bottom, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)
    `,
    description: '繁星点点，梦幻无垠',
  },
  {
    id: 'raindrop',
    name: '雨滴轻吟',
    emoji: '🌧️',
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(180, 220, 240, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(200, 230, 255, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(220, 240, 255, 0.1) 0%, transparent 50%),
      linear-gradient(to bottom, #f0f8ff 0%, #e6f3ff 50%, #dceeff 100%)
    `,
    description: '细雨绵绵，清新淡雅',
  },
  {
    id: 'meadow',
    name: '绿野仙踪',
    emoji: '🌾',
    background: `
      radial-gradient(ellipse at 25% 35%, rgba(150, 220, 150, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 65%, rgba(180, 230, 180, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(200, 240, 200, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #f0fff0 0%, #e8f5e8 50%, #dff0df 100%)
    `,
    description: '青草如茵，生机盎然',
  },
  {
    id: 'rose',
    name: '玫瑰花园',
    emoji: '🌹',
    background: `
      radial-gradient(ellipse at 20% 30%, rgba(255, 150, 180, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(255, 180, 200, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(255, 200, 220, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fff0f5 0%, #ffe8f0 50%, #ffdde8 100%)
    `,
    description: '玫瑰绽放，优雅迷人',
  },
  {
    id: 'twilight',
    name: '暮色黄昏',
    emoji: '',
    background: `
      radial-gradient(ellipse at 30% 25%, rgba(255, 180, 120, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 75%, rgba(200, 150, 200, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(220, 170, 180, 0.1) 0%, transparent 50%),
      linear-gradient(to bottom, #fff5ee 0%, #ffe8dc 50%, #ffdcc8 100%)
    `,
    description: '霞光万丈，温柔缱绻',
  },
  {
    id: 'mint',
    name: '薄荷清凉',
    emoji: '🌿',
    background: `
      radial-gradient(ellipse at 25% 30%, rgba(150, 230, 200, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 70%, rgba(180, 240, 220, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(200, 250, 230, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #f0fff8 0%, #e8fff0 50%, #dfffe8 100%)
    `,
    description: '薄荷清香，沁人心脾',
  },
  {
    id: 'cloud',
    name: '云朵绵柔',
    emoji: '☁️',
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(240, 245, 255, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(230, 240, 255, 0.1) 0%, transparent 50%),
      linear-gradient(to bottom, #ffffff 0%, #f8faff 50%, #f0f5ff 100%)
    `,
    description: '白云悠悠，轻盈柔软',
  },
  {
    id: 'amber',
    name: '琥珀流光',
    emoji: '✨',
    background: `
      radial-gradient(ellipse at 20% 35%, rgba(255, 220, 150, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 65%, rgba(255, 200, 120, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(255, 230, 170, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #fffbeb 0%, #fff5d6 50%, #ffefd0 100%)
    `,
    description: '琥珀光泽，温暖醇厚',
  },
];

interface ThemeContextType {
  currentTheme: ThemeOption;
  setThemeById: (id: string) => void;
  customBgUrls: string[];
  addCustomBg: (dataUrl: string) => void;
  removeCustomBg: (index: number) => void;
  selectedBgIndex: number | null;
  setSelectedBgIndex: (index: number | null) => void;
  isRotating: boolean;
  setIsRotating: (rotating: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: THEMES[0],
  setThemeById: () => {},
  customBgUrls: [],
  addCustomBg: () => {},
  removeCustomBg: () => {},
  selectedBgIndex: null,
  setSelectedBgIndex: () => {},
  isRotating: false,
  setIsRotating: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('our-space-theme') || THEMES[0].id;
  });

  // Load custom backgrounds from Supabase instead of localStorage
  const [customBgUrls, setCustomBgUrls] = useState<string[]>([]);
  const [loadingCustomBgs, setLoadingCustomBgs] = useState(true);

  const [selectedBgIndex, setSelectedBgIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem('our-space-selected-bg-index');
    return saved !== null ? parseInt(saved) : null;
  });

  const [isRotating, setIsRotating] = useState<boolean>(() => {
    return localStorage.getItem('our-space-rotating-bg') === 'true';
  });

  const [currentRotationIndex, setCurrentRotationIndex] = useState(0);

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Fetch custom backgrounds from Supabase on mount
  useEffect(() => {
    const fetchCustomBackgrounds = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_backgrounds')
          .select('data_url, sort_order')
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const urls = data.map(bg => bg.data_url);
          setCustomBgUrls(urls);
        }
      } catch (err) {
        console.error('Failed to fetch custom backgrounds:', err);
      } finally {
        setLoadingCustomBgs(false);
      }
    };

    fetchCustomBackgrounds();
  }, []);

  // Get the actual background URL to display
  const getDisplayBg = useCallback(() => {
    // If user has selected a custom background and is not rotating, use it
    if (!isRotating && selectedBgIndex !== null && selectedBgIndex < customBgUrls.length) {
      return customBgUrls[selectedBgIndex];
    }
    
    // If rotating and has custom backgrounds, use rotation
    if (isRotating && customBgUrls.length > 1) {
      return customBgUrls[currentRotationIndex % customBgUrls.length];
    }
    
    // Otherwise, use preset theme background
    return null;
  }, [customBgUrls, isRotating, selectedBgIndex, currentRotationIndex]);

  const applyBackground = useCallback(() => {
    const displayBg = getDisplayBg();
    if (displayBg) {
      document.body.style.background = `url(${displayBg}) center/cover no-repeat fixed`;
    } else {
      document.body.style.background = currentTheme.background;
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [getDisplayBg, currentTheme]);

  useEffect(() => {
    localStorage.setItem('our-space-theme', themeId);
    applyBackground();
  }, [themeId, applyBackground]);

  useEffect(() => {
    localStorage.setItem('our-space-custom-bgs', JSON.stringify(customBgUrls));
  }, [customBgUrls]);

  useEffect(() => {
    if (selectedBgIndex !== null) {
      localStorage.setItem('our-space-selected-bg-index', selectedBgIndex.toString());
    } else {
      localStorage.removeItem('our-space-selected-bg-index');
    }
  }, [selectedBgIndex]);

  useEffect(() => {
    localStorage.setItem('our-space-rotating-bg', isRotating.toString());
  }, [isRotating]);

  // Save custom background to Supabase
  const saveCustomBgToSupabase = async (dataUrl: string, sortOrder: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('custom_backgrounds')
        .insert({
          data_url: dataUrl,
          sort_order: sortOrder,
          created_by: user.id,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save custom background:', err);
    }
  };

  // Delete custom background from Supabase
  const deleteCustomBgFromSupabase = async (index: number) => {
    try {
      const { data, error } = await supabase
        .from('custom_backgrounds')
        .select('id')
        .order('sort_order', { ascending: true })
        .eq('data_url', customBgUrls[index]);

      if (error) throw error;

      if (data && data.length > 0) {
        const { error: deleteError } = await supabase
          .from('custom_backgrounds')
          .delete()
          .eq('id', data[0].id);

        if (deleteError) throw deleteError;
      }
    } catch (err) {
      console.error('Failed to delete custom background:', err);
    }
  };

  // Rotation interval
  useEffect(() => {
    if (!isRotating || customBgUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentRotationIndex((prev) => (prev + 1) % customBgUrls.length);
    }, 30000); // Change every 30 seconds
    return () => clearInterval(interval);
  }, [isRotating, customBgUrls.length]);

  const setThemeById = (id: string) => {
    // Clear custom background selection when switching to preset theme
    // This ensures the preset theme background takes effect immediately
    setSelectedBgIndex(null);
    setIsRotating(false);
    localStorage.removeItem('our-space-selected-bg-index');
    localStorage.removeItem('our-space-rotating-bg');
    setThemeId(id);
  };

  const addCustomBg = async (dataUrl: string) => {
    const newSortOrder = customBgUrls.length;
    
    // Save to Supabase first
    await saveCustomBgToSupabase(dataUrl, newSortOrder);
    
    // Then update local state
    setCustomBgUrls((prev) => [...prev, dataUrl]);
    
    // Auto-select the first uploaded image
    if (customBgUrls.length === 0) {
      setSelectedBgIndex(0);
    }
  };

  const removeCustomBg = async (index: number) => {
    // Delete from Supabase first
    await deleteCustomBgFromSupabase(index);
    
    // Then update local state
    setCustomBgUrls((prev) => prev.filter((_, i) => i !== index));
    
    // Adjust selected index if needed
    if (selectedBgIndex !== null) {
      if (selectedBgIndex === index) {
        setSelectedBgIndex(null);
      } else if (selectedBgIndex > index) {
        setSelectedBgIndex(selectedBgIndex - 1);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setThemeById, 
      customBgUrls, 
      addCustomBg, 
      removeCustomBg,
      selectedBgIndex,
      setSelectedBgIndex,
      isRotating,
      setIsRotating
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
