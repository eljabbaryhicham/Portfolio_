
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectAdmin from '@/features/admin/components/ProjectAdmin';
import ContactAdmin from '@/features/admin/components/ContactAdmin';
import MediaAdmin from '@/features/admin/components/MediaAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
import HomeAdmin from '@/features/admin/components/HomeAdmin';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { PortfolioItemFormSheet } from '@/features/admin/components/PortfolioItemForm';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import AdminManagement from '@/features/admin/components/AdminManagement';
import AboutAdmin from '@/features/admin/components/AboutAdmin';


function AdminPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
    
  const { user, isUserLoading } = useUser();

  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isPortfolioSheetOpen, setIsPortfolioSheetOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void } | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminActiveTab') || 'home';
    }
    return 'home';
  });
  const [fromMediaLibrary, setFromMediaLibrary] = useState(false);
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null);
  const [dialogActiveTab, setDialogActiveTab] = useState<'images' | 'videos'>('images');
  const [dialogActiveLibrary, setDialogActiveLibrary] = useState<'primary' | 'extented'>('primary');

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);
  
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    if (!user) {
      router.push('/login');
      return;
    }
  }, [isUserLoading, user, router]);


  const handleLogout = async (isUnauthorized = false) => {
    if (!auth) return;
    try {
      await signOut(auth);
      if (isUnauthorized) {
          toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You do not have permission to access the admin panel.",
          });
      } else {
          toast({
              title: "Signed Out",
              description: "You have successfully signed out.",
          });
      }
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not sign out.",
      });
    }
  };

  const handlePortfolioFormSubmit = (values: PortfolioItem, minOrder: number) => {
    if (!firestore || !canEditProjects) return;

    if (values.id) {
      // Existing item
      const dataToSave = { ...values, order: values.order ?? 0 };
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
       toast({
        title: 'Changes Saved',
        description: 'Your portfolio has been updated.',
      });
    } else {
      // New item, place it at the beginning
      const dataToSave = { ...values, order: minOrder - 1 };
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
       toast({
        title: 'Item Added',
        description: 'A new item has been added to your portfolio.',
      });
    }

    if (fromMediaLibrary) {
        setActiveTab('projects');
        setFromMediaLibrary(false);
    }
    setIsPortfolioSheetOpen(false);
  };
  
  const handleOpenPortfolioFormWithMedia = (url: string, type: 'image' | 'video', filename: string) => {
    const title = filename.split('.').slice(0, -1).join('.'); // Remove file extension
    setSelectedPortfolioItem({
      id: '',
      title: title || 'New Project',
      description: '',
      type: type,
      thumbnailUrl: type === 'video' ? '' : url, // For videos, thumbnail might be different
      sourceUrl: url,
      thumbnailHint: '',
    });
    setFromMediaLibrary(true);
    setIsLibraryOpen(false); // Close library
    setIsPortfolioSheetOpen(true); // Open form
  };

  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => {
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };
  
  const handlePortfolioSheetOpenChange = (isOpen: boolean) => {
    setIsPortfolioSheetOpen(isOpen);
    if (!isOpen) {
      // If form is closed, always clear the selection config
      setLibrarySelectionConfig(null);
      if (fromMediaLibrary) {
          // If form was opened from media library, reopen it on cancel
          setIsLibraryOpen(true);
          setFromMediaLibrary(false); // Reset the flag
      }
    }
  };

  const handleUploadComplete = async (docId: string, resourceType: 'image' | 'video', libraryId: 'primary' | 'extented') => {
    if (!docId) return;
    setNewlyUploadedId(docId);
    
    // Switch to media tab only if not already on it, to avoid unnecessary re-renders.
    if(activeTab !== 'media') {
      setActiveTab('media');
    }
    
    setDialogActiveTab(resourceType === 'video' ? 'videos' : 'images');
    setDialogActiveLibrary(libraryId);
    setIsLibraryOpen(true); // Open the library
    
    // Reset the animation highlight after a delay
    setTimeout(() => setNewlyUploadedId(null), 2000);
  };

  if (isUserLoading || !user) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent">
            <Preloader />
        </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full items-center justify-center min-h-full p-4">
        <div className="container mx-auto px-0 flex flex-col h-full min-h-0 w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-headline tracking-tight">Admin Panel</h1>
              <p className="mt-2 text-md md:text-lg text-foreground/70 break-all">
                Welcome, {typedUser?.username || typedUser?.email?.split('@')[0]}!
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <Button onClick={() => handleLogout(false)} variant="secondary">
                <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-8">
            <div className="w-full flex flex-wrap justify-center items-center gap-4 md:gap-0">
              <TabsList className="flex-wrap h-auto justify-center">
                <TabsTrigger value="home" className="glass-effect data-[state=active]:bg-destructive">Home</TabsTrigger>
                <TabsTrigger value="projects" className="glass-effect data-[state=active]:bg-destructive">Projects</TabsTrigger>
                <TabsTrigger value="about" className="glass-effect data-[state=active]:bg-destructive">About & Clients</TabsTrigger>
                <TabsTrigger value="contact" className="glass-effect data-[state=active]:bg-destructive">Contact</TabsTrigger>
              </TabsList>
              <div className="md:ml-auto">
                <TabsList className="flex-wrap h-auto justify-center">
                  <TabsTrigger value="media" className="glass-effect bg-blue-900/50 text-white data-[state=active]:bg-destructive data-[state=active]:animate-glow px-4 py-2">Media</TabsTrigger>
                  {isSuperAdmin && <TabsTrigger value="admins" className="glass-effect bg-blue-900/50 text-white data-[state=active]:bg-destructive data-[state=active]:animate-glow px-4 py-2">Admins</TabsTrigger>}
                </TabsList>
              </div>
            </div>
              <Separator className="bg-white/10 mt-4" />
              <TabsContent value="home" className="flex-1 overflow-auto mt-4">
                  <HomeAdmin />
              </TabsContent>
              <TabsContent value="projects" className="flex-1 overflow-auto mt-4">
                  <ProjectAdmin 
                    setSelectedItem={setSelectedPortfolioItem}
                    setIsSheetOpen={setIsPortfolioSheetOpen}
                  />
              </TabsContent>
              <TabsContent value="about" className="flex-1 overflow-auto mt-4">
                  <AboutAdmin />
              </TabsContent>
              <TabsContent value="contact" className="flex-1 overflow-auto mt-4">
                  <ContactAdmin />
              </TabsContent>
              <TabsContent value="media" className="flex-1 overflow-auto mt-4">
                  <MediaAdmin onUploadComplete={handleUploadComplete} onLibraryOpenRequest={() => setIsLibraryOpen(true)} onMediaSelect={handleOpenPortfolioFormWithMedia} />
              </TabsContent>
               {isSuperAdmin && (
                <TabsContent value="admins" className="flex-1 overflow-auto mt-4">
                  <AdminManagement />
                </TabsContent>
              )}
          </Tabs>
        </div>
      </div>
      <PortfolioItemFormSheet 
        isOpen={isPortfolioSheetOpen}
        setIsOpen={handlePortfolioSheetOpenChange}
        item={selectedPortfolioItem}
        onSubmit={(values) => handlePortfolioFormSubmit(values, 0)} // Note: minOrder logic is now in ProjectAdmin, may need to pass it up
        onChooseFromLibrary={handleOpenLibraryForSelection}
        canEdit={canEditProjects}
      />
      <MediaAdmin 
        isDialog={true}
        isOpen={isLibraryOpen}
        onOpenChange={(isOpen) => {
            setIsLibraryOpen(isOpen);
            if (!isOpen) {
                // If library is closed, clear selection mode
                setLibrarySelectionConfig(null);
            }
        }}
        onMediaSelect={librarySelectionConfig ? librarySelectionConfig.onSelect : handleOpenPortfolioFormWithMedia}
        isSelectionMode={!!librarySelectionConfig}
        onSelectionComplete={() => {
            setIsLibraryOpen(false);
            setLibrarySelectionConfig(null);
        }}
        activeTab={dialogActiveTab}
        setActiveTab={setDialogActiveTab}
        activeLibrary={dialogActiveLibrary}
        setActiveLibrary={setDialogActiveLibrary}
        newlyUploadedId={newlyUploadedId}
      />
    </>
  );
}

export default AdminPage;

    

    

    