"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { languages } from '@/app/i18n/settings';

type Language = typeof languages[number];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>('zh-CN');

  useEffect(() => {
    // 从URL中获取语言设置
    const pathSegments = pathname.split('/');
    const langFromPath = pathSegments[1];
    if (languages.includes(langFromPath as Language)) {
      setLanguageState(langFromPath as Language);
    }
  }, [pathname]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    // 更新URL
    const pathSegments = pathname.split('/');
    if (languages.includes(pathSegments[1] as Language)) {
      pathSegments[1] = newLang;
    } else {
      pathSegments.splice(1, 0, newLang);
    }
    const newPath = pathSegments.join('/');
    // 使用 replace 而不是 push，这样不会在历史记录中创建新条目
    router.replace(newPath);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 