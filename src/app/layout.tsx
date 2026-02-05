'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LayoutProvider } from '@/components/layout/layout-provider';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { I18nProvider, useI18n } from '@/context/i18n-context';

interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
    themeColor?: string;
}

interface MediaAsset {
    url: string;
}

function SiteBackground() {
    const firestore = useFirestore();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const backgroundType = isHomePage
        ? homeSettings?.homePageBackgroundType || 'video'
        : homeSettings?.websiteBackgroundType || 'video';

    const backgroundMediaId = isHomePage 
        ? homeSettings?.homePageBackgroundMediaId 
        : homeSettings?.websiteBackgroundMediaId;
    
    const backgroundProjectRef = useMemoFirebase(
        () => (firestore && backgroundMediaId && backgroundType === 'video' ? doc(firestore, 'projects', backgroundMediaId) : null),
        [firestore, backgroundMediaId, backgroundType]
    );
    const { data: backgroundProject } = useDoc<PortfolioItem>(backgroundProjectRef);

    const backgroundMediaRef = useMemoFirebase(
        () => (firestore && backgroundMediaId && backgroundType === 'image' ? doc(firestore, 'media', backgroundMediaId) : null),
        [firestore, backgroundMediaId, backgroundType]
    );
    const { data: backgroundMedia } = useDoc<MediaAsset>(backgroundMediaRef);

    const isVideoEnabled = isHomePage
      ? homeSettings?.isHomePageVideoEnabled ?? true
      : homeSettings?.isWebsiteVideoEnabled ?? true;

    const mediaUrl = backgroundType === 'video' 
      ? backgroundProject?.sourceUrl
      : backgroundMedia?.url;
      
    if (!isClient) {
        return <div className="absolute inset-0 -z-10 w-full h-full bg-black"></div>;
    }

    return (
        <div className="absolute inset-0 -z-10 w-full h-full">
            <div className="w-full h-full bg-black">
                {backgroundType === 'video' && isVideoEnabled && mediaUrl ? (
                    <video
                        key={mediaUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src={mediaUrl} type="video/mp4" />
                    </video>
                ) : backgroundType === 'image' && mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt="Background"
                      fill
                      className="object-cover"
                      priority
                    />
                ) : null}
            </div>
            <div className={cn("absolute inset-0", isHomePage ? "bg-black/60" : "bg-black/70")}></div>
        </div>
    );
}

function hexToHsl(hex: string): string | null {
    if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
        return null; // Invalid hex code
    }

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return null;
    }

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


function DynamicThemeStyles() {
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const [themeColor, setThemeColor] = useState('#2563eb');
    
    useEffect(() => {
        if (homeSettings?.themeColor) {
            setThemeColor(homeSettings.themeColor);
        }
    }, [homeSettings]);
    
    const primaryHsl = hexToHsl(themeColor);
  
    return primaryHsl ? (
      <style>{`
        :root {
            --primary: ${primaryHsl};
            --accent: ${primaryHsl};
            --destructive: ${primaryHsl};
            --ring: ${primaryHsl};
        }
        .dark {
            --primary: ${primaryHsl};
            --accent: ${primaryHsl};
            --destructive: ${primaryHsl};
            --ring: ${primaryHsl};
        }
      `}</style>
    ) : null;
  }
  
function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language } = useI18n();

  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Quicksand:wght@400;500;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
        {language === 'ar' && (
          <link href="https://fonts.googleapis.com/css2?family=Zain:wght@400;700&display=swap" rel="stylesheet" />
        )}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <title>Liquid Folio</title>
        <FirebaseClientProvider>
            <DynamicThemeStyles />
        </FirebaseClientProvider>
      </head>
      <body className={cn('font-body antialiased text-center', language === 'ar' && 'font-arabic')} suppressHydrationWarning>
          <FirebaseClientProvider>
              <SiteBackground />
              <LayoutProvider>
                  {children}
              </LayoutProvider>
              <Toaster />
          </FirebaseClientProvider>
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <I18nProvider>
      <AppContent>{children}</AppContent>
    </I18nProvider>
  );
}
