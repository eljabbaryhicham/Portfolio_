
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, memo, useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpDown, faXmark, faExpand, faPalette, faFilm, faArrowLeft, faArrowRight, faPencilAlt, faEnvelope, faPlus, faArrowDown, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
import { useIsExtraWide } from '@/hooks/use-is-extra-wide';
import { useIsMobile } from '@/hooks/use-mobile';
import { PortfolioItemFormSheet } from '@/features/admin/components/PortfolioItemForm';
import MediaAdmin from '@/features/admin/components/MediaAdmin';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ContactForm from '@/features/contact/components/ContactForm';
import type { AppUser } from '@/firebase/auth/use-user';
import PlyrPlayer from '@/components/PlyrPlayer';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { debounce } from 'lodash';
import { defaultEmailTemplate } from '@/features/admin/components/HomeAdmin';
import { useI18n } from '@/context/i18n-context';

const MemoizedImage = memo(Image);
const MemoizedPlyrPlayer = memo(PlyrPlayer);
const MemoizedCdnClapprPlayer = memo(CdnClapprPlayer);


const MemoizedPortfolioMedia = memo(({
  item,
  onFullscreenClick,
  onMediaLoaded,
  watermark,
  playerType,
  autoPlay,
  plyrRef,
}: {
  item: PortfolioItem;
  onFullscreenClick: (url: string) => void;
  onMediaLoaded: () => void;
  watermark?: string;
  playerType?: 'plyr' | 'clappr';
  autoPlay: boolean;
  plyrRef: React.Ref<any>;
}) => {

  useEffect(() => {
    onMediaLoaded();
  }, [item.id, onMediaLoaded]);

  if (item.type === 'video') {
    const isVimeo = item.sourceUrl?.includes('vimeo.com');
    const isYoutube = item.sourceUrl?.includes('youtube.com') || item.sourceUrl?.includes('youtu.be');

    return (
      <div className="relative aspect-video bg-black flex items-center justify-center w-full">
        {item.sourceUrl && (
          (isVimeo || isYoutube) ? (
            <MemoizedPlyrPlayer
                ref={plyrRef}
                key={item.id}
                source={item.sourceUrl}
                poster={item.useVideoFrameAsPoster ? undefined : item.thumbnailUrl}
                watermark={watermark}
                autoPlay={autoPlay}
                thumbnailVttUrl={item.thumbnailVttUrl}
            />
          ) : playerType === 'clappr' ? (
              <MemoizedCdnClapprPlayer
                  key={item.id} // Force re-mount for Clappr
                  source={item.sourceUrl} 
                  poster={item.useVideoFrameAsPoster ? undefined : item.thumbnailUrl}
                  watermark={watermark}
                  autoPlay={autoPlay}
              />
          ) : (
              <MemoizedPlyrPlayer
                  ref={plyrRef}
                  key={item.id} // Force re-mount to ensure clean state
                  source={item.sourceUrl} 
                  poster={item.useVideoFrameAsPoster ? undefined : item.thumbnailUrl}
                  watermark={watermark}
                  autoPlay={autoPlay}
                  thumbnailVttUrl={item.thumbnailVttUrl}
              />
          )
        )}
      </div>
    );
  }
  
  return (
      <div className="relative aspect-video bg-black flex justify-center items-center group w-full">
        <MemoizedImage
          src={item.sourceUrl || item.thumbnailUrl}
          alt={item.title}
          fill
          className="object-contain"
          onLoad={onMediaLoaded}
        />
        <Button
            variant="ghost"
            size="icon"
            className="absolute inset-0 m-auto z-10 h-12 w-12 md:h-16 md:w-16 text-white bg-black/50 opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => onFullscreenClick(item.sourceUrl || item.thumbnailUrl)}
          >
            <FontAwesomeIcon icon={faExpand} className="h-6 w-6 md:h-8 md:w-8" />
            <span className="sr-only">Fullscreen</span>
        </Button>
      </div>
    );
});
MemoizedPortfolioMedia.displayName = 'MemoizedPortfolioMedia';


const PortfolioGridItem = ({ item, onClick, onEditClick, isAdmin, isSuperAdmin, onSwitchPlayer }: { item: PortfolioItem, onClick: () => void, onEditClick: () => void, isAdmin: boolean, isSuperAdmin: boolean, onSwitchPlayer: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the main onClick from firing
    onEditClick();
  };

  const handleSwitchPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSwitchPlayer();
  };

  return (
    <div className="p-[2px] rounded-lg glass-effect">
      <div
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 md:hover:scale-[1.02] aspect-square',
          'bg-black/20'
        )}
        onClick={onClick}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Preloader />
          </div>
        )}
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          className={cn(
            "object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100 md:group-hover:scale-105" : "opacity-0"
          )}
          data-ai-hint={item.thumbnailHint}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onLoad={() => setIsLoaded(true)}
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 md:p-4",
          !isLoaded && "opacity-100 bg-none" // Show overlay content while loading
        )}>
          {isLoaded ? (
            <>
              <h3 className="font-bold text-white text-base md:text-lg">
                {item.title}
              </h3>
              <p className="text-white/80 text-xs md:text-sm line-clamp-2">
                {item.description}
              </p>
            </>
          ) : (
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          )}
        </div>
        {item.type === 'video' && isLoaded && (
          <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
            <FontAwesomeIcon icon={faFilm} className="h-1/2 w-1/2 text-white/80" />
          </div>
        )}
        {item.type === 'image' && isLoaded && (
            <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
                <FontAwesomeIcon icon={faPalette} className="h-1/2 w-1/2 text-white/80" />
            </div>
        )}
        {(isAdmin || (isSuperAdmin && item.type === 'video')) && isLoaded && (
          <div className="absolute top-4 left-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEditClick}
              >
                <FontAwesomeIcon icon={faPencilAlt} className="h-4 w-4" />
                <span className="sr-only">Edit Project</span>
              </Button>
            )}
            {isSuperAdmin && item.type === 'video' && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSwitchPlayerClick}
                title="Switch Default Player"
              >
                <FontAwesomeIcon icon={faSyncAlt} className="h-4 w-4" />
                <span className="sr-only">Switch Player</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface HomePageSettings {
    workPagePlayer?: 'plyr' | 'clappr';
    emailFromName?: string;
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export default function WorkPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);

  const projectsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'projects'), orderBy('order'))
        : null,
    [firestore]
  );
  const { data: portfolioItems, isLoading: isPortfolioLoading } = useCollection<PortfolioItem>(projectsQuery);

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

  const selectedSlug = searchParams.get('id');

  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<PortfolioItem | null>(null);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  
  // Initialize with a default value to avoid the deadlock in the isLoading check
  const [visibleItemsCount, setVisibleItemsCount] = useState<number | null>(12);
  const [itemsPerLoad, setItemsPerLoad] = useState<number>(12);

  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const isExtraWide = useIsExtraWide();
  const [isCloseButtonVisible, setIsCloseButtonVisible] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<any>(null);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void } | null>(null);
  const [dialogActiveTab, setDialogActiveTab] = useState<'images' | 'videos'>('images');
  const [dialogActiveLibrary, setDialogActiveLibrary] = useState<'primary' | 'extented'>('primary');
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isDialogMediaLoading, setIsDialogMediaLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const isDialogOpen = isDetailsModalOpen || isContactFormOpen;

  const allItems = useMemo(() => {
    return portfolioItems?.filter(item => item.isVisible !== false) || [];
  }, [portfolioItems]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter(item => item.type === filter);
  }, [allItems, filter]);
  
  const calculateAndSetItems = useCallback(debounce(() => {
    if (isMobile) {
        const mobileInitialLoad = 8;
        setItemsPerLoad(mobileInitialLoad);
        setVisibleItemsCount(prev => prev === null ? mobileInitialLoad : prev);
        return;
    }

    if (gridRef.current) {
        const itemMinWidth = 300; 
        const gridGap = 16; 

        const gridWidth = gridRef.current.offsetWidth;
        const columnCount = Math.max(1, Math.floor((gridWidth + gridGap) / (itemMinWidth + gridGap)));
        
        const itemHeightWithGap = (gridWidth / columnCount);
        
        const gridHeight = window.innerHeight * 0.8;
        const rowCount = Math.max(1, Math.floor(gridHeight / itemHeightWithGap));
        
        const calculatedCount = columnCount * rowCount;
        setItemsPerLoad(calculatedCount);
        setVisibleItemsCount(prev => prev === null ? calculatedCount : prev);
    }
  }, 200), [isMobile]);

  useEffect(() => {
    setIsClient(true);
    calculateAndSetItems();

    window.addEventListener('resize', calculateAndSetItems);
    
    return () => {
      window.removeEventListener('resize', calculateAndSetItems);
    };
  }, [calculateAndSetItems]);

  useEffect(() => {
    setVisibleItemsCount(prev => (prev === null ? null : itemsPerLoad));
  }, [filter, itemsPerLoad]);

  useEffect(() => {
    const player = plyrRef.current?.plyr;
    if (player) {
        if (isDialogOpen) {
            player.pause();
        }
    }
  }, [isDialogOpen]);


  const showMoreItems = () => {
    setVisibleItemsCount(prev => (prev || 0) + itemsPerLoad);
  };

  useEffect(() => {
    if (selectedSlug && portfolioItems) {
      const item = portfolioItems.find(p => slugify(p.title) === selectedSlug);
      if (item) {
        handleItemClick(item);
      } else {
        setSelectedItem(null);
      }
    } else {
      setSelectedItem(null);
    }
  }, [selectedSlug, portfolioItems]);
  
  const updateUrl = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('id', slug);
    } else {
      params.delete('id');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleItemClick = useCallback((item: PortfolioItem) => {
    setIsDialogMediaLoading(true);
    setDirection(null); 
    setSelectedItem(item);
    updateUrl(slugify(item.title));
  }, [router, pathname, searchParams]);
  
  const minOrder = useMemo(() => {
    if (!portfolioItems || portfolioItems.length === 0) return 0;
    return Math.min(...portfolioItems.map(i => i.order || 0));
  }, [portfolioItems]);

  const handleMainDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
      updateUrl(null);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setIsDialogMediaLoading(true);
      const LONG_DESCRIPTION_THRESHOLD = 150;
      setIsDescriptionLong(
        (selectedItem.description?.length || 0) > LONG_DESCRIPTION_THRESHOLD
      );
    } else {
      setIsDescriptionLong(false);
    }
  }, [selectedItem]);

  const handleNextProject = useCallback(() => {
    if (!selectedItem || !filteredItems) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    const nextItem = filteredItems[nextIndex];
    handleItemClick(nextItem);
    setDirection('next');
  }, [selectedItem, filteredItems, handleItemClick]);

  const handlePreviousProject = useCallback(() => {
    if (!selectedItem || !filteredItems) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    const prevItem = filteredItems[prevIndex];
    handleItemClick(prevItem);
    setDirection('prev');
  }, [selectedItem, filteredItems, handleItemClick]);

  const handleDialogMouseMove = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(true);
    inactivityTimer.current = setTimeout(() => {
      setIsCloseButtonVisible(false);
    }, 1000);
  };

  const handleDialogMouseEnter = () => {
    setIsCloseButtonVisible(true);
  };

  const handleDialogMouseLeave = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(false);
  };

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItemForEdit(item);
    setIsFormSheetOpen(true);
  };

  const handlePortfolioFormSubmit = (values: PortfolioItem) => {
    if (!firestore) return;
    if(!canEditProjects) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You do not have permission to edit projects.',
        });
        return;
    }

    if (values.id) {
      const dataToSave = { ...values, order: values.order ?? 0 };
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: 'Changes Saved',
        description: 'Your portfolio has been updated.',
      });
    } else {
      const dataToSave = { ...values, order: minOrder - 1 };
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
      toast({
        title: 'Item Added',
        description: 'A new item has been added to your portfolio.',
      });
    }
    setIsFormSheetOpen(false);
  };

  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => {
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 300;

    if (info.offset.x > swipeThreshold && info.velocity.x > swipeVelocityThreshold) {
      handlePreviousProject();
    } else if (info.offset.x < -swipeThreshold && info.velocity.x < -swipeVelocityThreshold) {
      handleNextProject();
    }
  };

  const handleSwitchPlayer = () => {
    if (!settingsDocRef || !isSuperAdmin) return;
    const newPlayer =
      homeSettings?.workPagePlayer === 'plyr' ? 'clappr' : 'plyr';
    setDocumentNonBlocking(settingsDocRef, { workPagePlayer: newPlayer }, { merge: true });
    toast({
      title: 'Player Switched',
      description: `Work page will now use the ${
        newPlayer.charAt(0).toUpperCase() + newPlayer.slice(1)
      } player.`,
    });
  };
  
  const effectiveItemsCount = visibleItemsCount || 0;
  const itemsToShow = useMemo(() => {
      return filteredItems.slice(0, effectiveItemsCount);
  }, [filteredItems, effectiveItemsCount]);

  const showMoreButtonNeeded = visibleItemsCount !== null && filteredItems.length > effectiveItemsCount;

  const isLoading = isPortfolioLoading;

  const variants = {
    enter: (direction: 'next' | 'prev' | null) => ({
      x: direction === 'next' ? '100%' : direction === 'prev' ? '-100%' : '0%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: '0%',
      opacity: 1,
      scale: 1,
    },
    exit: (direction: 'next' | 'prev' | null) => ({
      x: direction === 'prev' ? '100%' : direction === 'next' ? '-100%' : '0%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };
  
  const gridStyle = isMobile 
    ? { gridTemplateColumns: 'repeat(2, 1fr)' } 
    : { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' };

  const logoUrl = contactInfo?.logoUrl;
  const workPagePlayer = homeSettings?.workPagePlayer || 'clappr';

  const emailFromName = homeSettings?.emailFromName || 'BELOFTED';
  const emailTemplate = homeSettings?.emailHtmlTemplate || defaultEmailTemplate;
  const emailLogoUrl = homeSettings?.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png';
  const emailLogoScale = homeSettings?.emailLogoScale || 1;

  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-8 pb-4">
          <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{t('work.title')}</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                {t('work.description')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button variant={filter === 'all' ? 'destructive' : 'outline'} onClick={() => setFilter('all')}>
                {t('work.all_projects')}
              </Button>
              <Button variant={filter === 'image' ? 'destructive' : 'outline'} onClick={() => setFilter('image')}>
                <FontAwesomeIcon icon={faPalette} className="mr-2 h-4 w-4" />
                {t('work.graphics')}
              </Button>
              <Button variant={filter === 'video' ? 'destructive' : 'outline'} onClick={() => setFilter('video')}>
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" />
                {t('work.animation')}
              </Button>
            </div>
          </div>
        </div>
        <Separator className="bg-white/10" />

        <ScrollArea className="flex-1">
          <div className="p-8 pt-4 flex items-center justify-center min-h-full">
            <div className="container mx-auto px-0 min-h-full flex items-center justify-center">
              <AnimatePresence>
                <motion.div
                    key={filter}
                    ref={gridRef}
                    className="grid gap-4 w-full"
                    style={gridStyle}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {isLoading ? (
                      <div className="col-span-full h-full min-h-[50vh] flex items-center justify-center">
                        <Preloader />
                      </div>
                    ) : (
                      <>
                        {itemsToShow.map(item => (
                          <motion.div key={item.id} variants={itemVariants}>
                            <PortfolioGridItem 
                              item={item}
                              onClick={() => handleItemClick(item)}
                              onEditClick={() => handleEditItem(item)}
                              isAdmin={!!user}
                              isSuperAdmin={isSuperAdmin}
                              onSwitchPlayer={handleSwitchPlayer}
                            />
                          </motion.div>
                        ))}
                        {showMoreButtonNeeded && (
                          <motion.div
                            variants={itemVariants}
                            className="p-[2px] rounded-lg glass-effect"
                          >
                            <div
                              className="group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 md:hover:scale-[1.02] aspect-square bg-black/20"
                              onClick={showMoreItems}
                            >
                              <div className="w-full h-full rounded-md flex flex-col items-center justify-center text-center p-4 transition-colors duration-300 md:group-hover:bg-black/40">
                                <FontAwesomeIcon icon={faArrowDown} className="h-10 w-10 text-white/70 mb-4 transition-transform duration-300 md:group-hover:translate-y-1" />
                                <h3 className="font-bold text-white text-lg">{t('work.show_more')}</h3>
                                <p className="text-white/60 text-sm">
                                  {filteredItems.length - itemsToShow.length} {t('work.more_projects')}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
            </div>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={handleMainDialogOpenChange}>
          <DialogContent
            className={cn(
              "glass-effect p-0 flex flex-col group overflow-hidden",
              "w-[90vw] max-w-7xl",
              isExtraWide || isDescriptionLong ? "h-[90vh]" : "max-h-[90vh]"
            )}
            onMouseMove={handleDialogMouseMove}
            onMouseEnter={handleDialogMouseEnter}
            onMouseLeave={handleDialogMouseLeave}
          >
            {isDialogMediaLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                <Preloader />
              </div>
            )}
            <motion.div
                onDragEnd={handleDragEnd}
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                className="flex-1 flex flex-col min-h-0 h-full w-full"
            >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {selectedItem && (
                  <motion.div
                    className='h-full w-full flex flex-col'
                    key={selectedItem.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="flex flex-col flex-1 min-h-0 h-full">
                      <DialogHeader className="p-4 md:p-6 flex-shrink-0 relative">
                        <div className="text-center">
                          <DialogTitle className="text-xl md:text-2xl font-headline">
                            {selectedItem.title}
                          </DialogTitle>
                          <DialogDescription className="text-sm md:text-base text-center text-foreground/70 mt-2 md:mt-4 whitespace-pre-wrap max-w-2xl mx-auto">
                              {selectedItem.description}
                          </DialogDescription>
                        </div>
                      
                        <div className="mt-4 flex justify-between px-8 md:px-0 md:block">
                          <Button
                              variant="outline"
                              size="icon"
                              onClick={handlePreviousProject}
                              disabled={filteredItems.length <= 1}
                              className="md:absolute md:left-16 md:top-1/2 md:-translate-y-1/2 h-8 w-8 md:h-10 md:w-10"
                          >
                              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 md:h-5 md:w-5" />
                              <span className="sr-only">{t('dialog.previous_project')}</span>
                          </Button>
                          <Button
                              variant="outline"
                              size="icon"
                              onClick={handleNextProject}
                              disabled={filteredItems.length <= 1}
                              className="md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 h-8 w-8 md:h-10 md:w-10"
                          >
                              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 md:h-5 md:w-5" />
                              <span className="sr-only">{t('dialog.next_project')}</span>
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <Separator className="bg-white/10 my-0" />
                      
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="relative flex flex-col justify-center h-full">
                          <div className={cn("w-full transition-opacity duration-300", isDialogMediaLoading && "opacity-0")}>
                            {isClient && (
                              <MemoizedPortfolioMedia
                                item={selectedItem}
                                onFullscreenClick={setFullscreenImageUrl}
                                onMediaLoaded={() => setIsDialogMediaLoading(false)}
                                watermark={logoUrl}
                                playerType={workPagePlayer}
                                autoPlay={!isDialogOpen}
                                plyrRef={plyrRef}
                              />
                            )}
                          </div>
                            
                          <div className="p-4 md:p-6 text-center flex flex-wrap justify-center gap-4 flex-shrink-0">
                            {selectedItem.details && (
                                <Button
                                  variant="default"
                                  onClick={() => setDetailsModalOpen(true)}
                                >
                                  <FontAwesomeIcon icon={faUpDown} className="mr-2" />
                                  {t('dialog.show_details')}
                                </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => setIsContactFormOpen(true)}
                              className="h-auto py-2 px-4 leading-tight text-center"
                            >
                              {t('dialog.ask_about')}
                            </Button>
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
            <DialogClose className={cn(
                "absolute right-4 top-4 z-30 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hover:opacity-100",
                isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
            )}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogContent>
      </Dialog>
      
      {/* Nested Dialog for Details */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col group"
          onMouseMove={handleDialogMouseMove}
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
        >
            {selectedItem && (
                <>
                <DialogHeader className="p-4 md:p-6 pb-0">
                    <DialogTitle className="font-headline">{selectedItem.title} - Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-foreground/80 whitespace-pre-wrap p-4 md:p-6">
                        {selectedItem.details || ''}
                    </div>
                </ScrollArea>
                 <DialogClose className={cn(
                    "absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center md:hover:!opacity-100 ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
                  )}>
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Contact Form Dialog */}
      <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
        <DialogContent className="w-[80vw] max-w-xl glass-effect">
            <DialogHeader>
              <DialogTitle className="font-headline">{t('contact.title')}</DialogTitle>
              <DialogDescription>
                Have a question about &quot;{selectedItem?.title}&quot;? Fill out the form below.
              </DialogDescription>
            </DialogHeader>
            <ContactForm
                onSuccess={() => setIsContactFormOpen(false)}
                defaultMessage={selectedItem ? `I'm contacting you about discuss a similar project of "${selectedItem.title}"` : ''}
                emailFromName={emailFromName}
                emailHtmlTemplate={emailTemplate}
                emailLogoUrl={emailLogoUrl}
                emailLogoScale={emailLogoScale}
            />
            <DialogClose className={cn(
                "absolute right-4 top-4 h-8 w-8",
                "flex items-center justify-center rounded-full transition-opacity",
                "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none"
            )}>
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImageUrl} onOpenChange={(open) => !open && setFullscreenImageUrl(null)}>
        <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0 group"
          onMouseMove={handleDialogMouseMove}
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
        >
          <DialogTitle className="sr-only">Fullscreen Image</DialogTitle>
          {fullscreenImageUrl && (
            <div className="relative w-full h-full">
              <MemoizedImage
                src={fullscreenImageUrl}
                alt="Fullscreen Image"
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
          <DialogClose className={cn(
              "absolute top-4 right-4 z-[101] h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center md:hover:!opacity-100 ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
          )}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {!!user && (
        <>
          <PortfolioItemFormSheet 
            isOpen={isFormSheetOpen}
            setIsOpen={(isOpen) => {
                setIsFormSheetOpen(isOpen);
                if (!isOpen) {
                    setLibrarySelectionConfig(null);
                }
            }}
            item={selectedItemForEdit}
            onSubmit={handlePortfolioFormSubmit}
            onChooseFromLibrary={handleOpenLibraryForSelection}
            canEdit={canEditProjects}
          />
          <MediaAdmin 
            isDialog={true}
            isOpen={isLibraryOpen}
            onOpenChange={(isOpen) => {
                setIsLibraryOpen(isOpen);
                if (!isOpen) {
                    setLibrarySelectionConfig(null);
                }
            }}
            onMediaSelect={(url, type, filename) => {
              if (librarySelectionConfig?.onSelect) {
                librarySelectionConfig.onSelect(url, type, filename);
              }
            }}
            isSelectionMode={!!librarySelectionConfig}
            onSelectionComplete={() => {
              setIsLibraryOpen(false);
              setLibrarySelectionConfig(null);
            }}
            activeTab={dialogActiveTab}
            setActiveTab={setDialogActiveTab}
            activeLibrary={dialogActiveLibrary}
            setActiveLibrary={setDialogActiveLibrary}
            newlyUploadedId={null}
          />
        </>
      )}
    </>
  );
}
