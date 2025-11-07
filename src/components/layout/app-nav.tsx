
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { motion } from "framer-motion";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faImage, faCircleInfo, faEnvelope, faShieldHalved, faVial, faGlobe } from "@fortawesome/free-solid-svg-icons";
import Logo from "../logo";
import { doc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";


const navItems = [
  { href: "/", label: "Home", i18nKey: "nav.home", icon: faHouse, public: true },
  { href: "/work", label: "Work", i18nKey: "nav.work", icon: faImage, public: true },
  { href: "/about", label: "About", i18nKey: "nav.about", icon: faCircleInfo, public: true },
  { href: "/contact", label: "Contact", i18nKey: "nav.contact", icon: faEnvelope, public: true },
  { href: "/admin", label: "Admin", i18nKey: "nav.admin", icon: faShieldHalved, public: false, adminOnly: true },
  { href: "/test", label: "Test", i18nKey: "nav.test", icon: faVial, public: false, adminOnly: true },
];

interface HomePageSettings {
    isTestPageEnabled?: boolean;
}

interface ContactInfo {
    logoUrl?: string;
    logoScale?: number;
}

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const { setLanguage, t } = useI18n();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc<ContactInfo>(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);


  const logoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";
  const logoScale = contactInfo?.logoScale || 1;

  const accessibleNavItems = navItems.filter(item => {
    if (item.href === '/test') {
        return homeSettings?.isTestPageEnabled && user;
    }
    if(item.adminOnly) {
        return user;
    }
    return item.public;
  });
  
  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
    const isAdminButton = item.label === 'Admin';
    const isTestButton = item.label === 'Test';
    const isSpecialButton = isAdminButton || isTestButton;

    const navButtonContent = (
      <motion.div 
        className="relative"
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={{
          rest: { scale: 1, rotate: 0 },
          hover: { scale: 1.1, rotate: [0, 10, -5, 0] },
        }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center justify-center rounded-full transition-all duration-300 aspect-square",
            isMobile ? 'h-[clamp(2.5rem,10vw,3rem)] w-[clamp(2.5rem,10vw,3rem)]' : "h-10 w-10",
            "text-white",
            isActive ? "" : (isSpecialButton ? "bg-cyan-500/80" : "glass-effect"),
          )}
        >
          {isActive && (
            <motion.div
              layoutId="active-nav-highlight"
              className={cn(
                "absolute inset-0 rounded-full",
                isTestButton
                  ? "bg-blue-500 shadow-[0_0_15px_#3b82f680,_0_0_20px_#3b82f660]"
                  : isAdminButton
                    ? "bg-green-500 shadow-[0_0_15px_#22c55e80,_0_0_20px_#22c55e60]"
                    : "bg-destructive shadow-[0_0_15px_hsl(var(--primary)/0.8),_0_0_20px_hsl(var(--primary)/0.6)]"
              )}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <FontAwesomeIcon
            icon={item.icon}
            className={cn(
              "h-[50%] w-[50%] relative z-10 transition-colors",
              isActive ? "text-white" : "text-white/70 group-hover:text-white"
            )}
          />
        </Link>
      </motion.div>
    );

    if (isMobile) {
      return (
        <div key={item.href} className="h-full flex flex-shrink-0 basis-auto items-center justify-center">
            {navButtonContent}
        </div>
      );
    }

    return (
      <TooltipProvider key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>
            {navButtonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="glass-effect rounded-md">
            <p>{t(item.i18nKey)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  };
  
  const renderLanguageSwitcher = () => {
    const switcherContent = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            className="relative"
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={{
              rest: { scale: 1, rotate: 0 },
              hover: { scale: 1.1, rotate: [0, 10, -5, 0] },
            }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "group relative flex items-center justify-center rounded-full transition-all duration-300 aspect-square glass-effect",
                isMobile ? 'h-[clamp(2.2rem,8vw,2.5rem)] w-[clamp(2.2rem,8vw,2.5rem)]' : "h-8 w-8",
                "text-white"
              )}
            >
              <FontAwesomeIcon icon={faGlobe} className="h-[50%] w-[50%] relative z-10 transition-colors text-white/70 group-hover:text-white" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="glass-effect" side={isMobile ? "top" : "right"}>
          <DropdownMenuItem onClick={() => setLanguage('en')}>ENG</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage('fr')}>FR</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

     if (isMobile) {
      return (
        <div className="h-full flex flex-shrink-0 basis-auto items-center justify-center">
          {switcherContent}
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {switcherContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="glass-effect rounded-md">
            <p>{t('nav.language')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isMobile) {
    return (
      <motion.div
        className="w-full flex-shrink-0 p-2"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      >
        <div className={cn(
          "flex h-[7vh] min-h-[60px] flex-row items-center justify-between rounded-lg border border-border/50 glass-effect"
          )}>
          <nav className="flex h-full flex-1 items-center justify-center px-[5vw] gap-8">
            {accessibleNavItems.map(renderNavItem)}
            {renderLanguageSwitcher()}
          </nav>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      className="w-full md:w-auto flex-shrink-0 p-2"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <div className={cn(
        "flex h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 px-2 py-4 md:p-4 glass-effect"
        )}>
        <Link href="/" className="hidden md:block relative group mt-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-spinning-circle-border bg-gradient-to-r from-primary via-transparent to-transparent"></div>
                <div className="relative bg-transparent rounded-full p-1 w-10 h-10 flex items-center justify-center" style={{ transform: `scale(${logoScale})`}}>
                    <Logo src={logoUrl} />
                </div>
            </div>
        </Link>
        <nav 
          className="flex flex-row md:flex-col items-center justify-center w-full md:w-auto md:gap-8"
        >
           {accessibleNavItems.map(renderNavItem)}
        </nav>
        <div className="flex flex-col items-center gap-8">
          {renderLanguageSwitcher()}
        </div>
      </div>
    </motion.aside>
  );
}
