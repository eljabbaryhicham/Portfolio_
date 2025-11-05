
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";
import Preloader from "@/components/preloader";
import Logo from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

interface ContactInfo {
    logoUrl?: string;
    logoScale?: number;
}

interface HomePageSettings {
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
    homePageLogoScale?: number;
}

export default function HomePageContent() {
  const firestore = useFirestore();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading: isLoadingContact } = useDoc<ContactInfo>(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
  
  const isLoading = isLoadingContact || isLoadingSettings;

  const siteLogoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";
  const homeLogoUrl = homeSettings?.homePageLogoUrl || siteLogoUrl;
  const isLogoVisible = homeSettings?.isHomePageLogoVisible ?? true;
  const logoScale = homeSettings?.homePageLogoScale || 1;


  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4">
      {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
              <Preloader />
          </div>
      )}

      <div className={cn("relative z-10 flex flex-col items-center justify-center gap-8 transition-opacity duration-1000", isLoading && "opacity-0")}>
        {isLogoVisible && (
            <div className="w-full max-w-sm" style={{ transform: `scale(${logoScale})`}}>
                <Logo src={homeLogoUrl} />
            </div>
        )}
        <Button asChild size="lg" className="group">
          <Link href="/work">
            Explore Work
            <FontAwesomeIcon icon={faArrowRight} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
