
'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFilm, faFileImage, faImages, faXmark, faPlus, faEye, faFolderOpen, faLink, faUniversity, faStar, faPhotoFilm, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, DocumentReference, where, getDocs, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import AddFromUrlDialog from './AddFromUrlDialog';
import type { AppUser } from '@/firebase/auth/use-user';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


// Type for the media stored in Firestore
interface MediaAsset {
    id: string;
    url: string;
    public_id: string;
    resource_type: 'image' | 'video' | 'raw';
    created_at: string;
    filename: string;
    libraryId?: 'primary' | 'extented';
    videoFormat?: 'mp4' | 'm3u8';
    title?: string;
}

const MediaFileCard = ({
  file,
  onDelete,
  onCopy,
  onPreview,
  onSetLogo,
  onSetBackground,
  isNewlyUploaded,
  onMediaSelect,
  isSelectionMode,
  canDelete,
  canEditContact,
  canEditHome,
}: {
  file: MediaAsset;
  onDelete: (publicId: string, id: string, resourceType: string, libraryId: 'primary' | 'extented') => void;
  onCopy: (url: string) => void;
  onPreview: (file: MediaAsset) => void;
  onSetLogo: (url: string) => void;
  onSetBackground: (file: MediaAsset) => void;
  isNewlyUploaded: boolean;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  isSelectionMode: boolean;
  canDelete: boolean;
  canEditContact: boolean;
  canEditHome: boolean;
}) => {
  
  const handleDelete = () => {
    onDelete(file.public_id, file.id, file.resource_type, file.libraryId || 'primary');
  };

  const handleSelect = () => {
    onMediaSelect(file.url, file.resource_type, file.filename);
  };

  const fileName = file.filename || file.public_id.split('/').pop() || 'Untitled';
  
  return (
    <div className={cn("flex flex-col gap-2", isNewlyUploaded && 'animate-shake')}>
      <div 
        className={cn(
          "relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1",
          isSelectionMode && "cursor-pointer"
        )}
        onClick={isSelectionMode ? handleSelect : undefined}
      >
        <div className="relative w-full h-full rounded-md overflow-hidden">
          {file.resource_type === 'image' ? (
            <Image src={file.url} alt={file.public_id} fill className="object-cover" />
          ) : file.resource_type === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <Image src={file.url.replace(/\.(webm|m3u8)$/, '.jpg').replace(/\.mp4$/, '.jpg')} alt={file.public_id} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <FontAwesomeIcon icon={faFilm} className="h-8 w-8 text-white/70" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <FontAwesomeIcon icon={faFileLines} className="h-8 w-8 text-white/70" />
            </div>
          )}
        </div>

        <div className={cn(
            "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 z-10",
            isSelectionMode && "group-hover:opacity-100"
        )}>
           {isSelectionMode ? (
              <div className="text-white text-center">
                <FontAwesomeIcon icon={faImages} className="h-8 w-8 mb-2" />
                <p className="font-bold">Select</p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                <Button size="icon" variant="ghost" onClick={() => onPreview(file)} title="Preview" className="h-8 w-8 md:h-10 md:w-10 text-white glass-effect">
                  <FontAwesomeIcon icon={faEye} />
                </Button>
                {file.resource_type !== 'raw' && (
                  <Button size="icon" variant="default" onClick={() => onMediaSelect(file.url, file.resource_type, file.filename)} title="Create Project" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                )}
                {canEditHome && (
                  <Button size="icon" variant="secondary" onClick={() => onSetBackground(file)} title="Set as Background" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faPhotoFilm} />
                  </Button>
                )}
                {file.resource_type === 'image' && canEditContact && (
                  <Button size="icon" variant="secondary" onClick={() => onSetLogo(file.url)} title="Set as Logo" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                    <FontAwesomeIcon icon={faStar} />
                  </Button>
                )}
                <Button size="icon" variant="secondary" onClick={() => onCopy(file.url)} title="Copy URL" className="h-8 w-8 md:h-10 md:w-10 glass-effect">
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" title="Delete" className="h-8 w-8 md:h-10 md:w-10">
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[80vw]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the file from your Cloudinary storage. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground truncate" title={fileName}>{fileName}</p>
    </div>
  );
};

interface StandaloneMediaAdminProps {
  isDialog?: false;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  onUploadComplete: (docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => void;
  onLibraryOpenRequest: () => void;
  isOpen?: never;
  onOpenChange?: never;
  isSelectionMode?: never;
  onSelectionComplete?: never;
  activeTab?: never;
  setActiveTab?: never;
  activeLibrary?: never;
  setActiveLibrary?: never;
  newlyUploadedId?: never;
}

interface DialogMediaAdminProps {
  isDialog: true;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMediaSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void;
  isSelectionMode: boolean;
  onSelectionComplete: () => void;
  activeTab: 'images' | 'videos' | 'files';
  setActiveTab: (tab: 'images' | 'videos' | 'files') => void;
  activeLibrary: 'primary' | 'extented';
  setActiveLibrary: (library: 'primary' | 'extented') => void;
  newlyUploadedId: string | null;
  onUploadComplete?: never;
  onLibraryOpenRequest?: never;
}

type MediaAdminProps = StandaloneMediaAdminProps | DialogMediaAdminProps;

export default function MediaAdmin(props: MediaAdminProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [previewFile, setPreviewFile] = useState<MediaAsset | null>(null);
  const [isAddFromUrlOpen, setIsAddFromUrlOpen] = useState(false);
  const [isChoosingLibrary, setIsChoosingLibrary] = useState(false);
  const [isChoosingVideoFormat, setIsChoosingVideoFormat] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadVideoFormat, setUploadVideoFormat] = useState<'mp4' | 'm3u8'>('mp4');
  
  // State for setting background
  const [isSetBackgroundOpen, setIsSetBackgroundOpen] = useState(false);
  const [backgroundTarget, setBackgroundTarget] = useState<'home' | 'website'>('home');
  const [backgroundFile, setBackgroundFile] = useState<MediaAsset | null>(null);

  const activeTab = props.isDialog ? props.activeTab : 'images';
  const setActiveTab = props.isDialog ? props.setActiveTab : () => {};
  const activeLibrary = props.isDialog ? props.activeLibrary : 'primary';
  const setActiveLibrary = props.isDialog ? props.setActiveLibrary : () => {};
  
  const newlyUploadedId = props.isDialog ? props.newlyUploadedId : null;

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canUpload = isSuperAdmin || (typedUser?.permissions?.canUploadMedia ?? true);
  const canDelete = isSuperAdmin || (typedUser?.permissions?.canDeleteMedia ?? true);
  const canEditHome = isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true);
  const canEditContact = isSuperAdmin || (typedUser?.permissions?.canEditContact ?? true);


  // Fetch media assets from Firestore
  const mediaCollectionRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'media'), orderBy('created_at', 'desc')) : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollectionRef);

  const { imageAssets, videoAssets, otherAssets } = useMemo(() => {
    const images: MediaAsset[] = [];
    const videos: MediaAsset[] = [];
    const others: MediaAsset[] = [];
    mediaAssets?.forEach(asset => {
        const libraryMatch = asset.libraryId === activeLibrary || (activeLibrary === 'primary' && !asset.libraryId);
        if (libraryMatch) {
            if (asset.resource_type === 'image') {
                images.push(asset);
            } else if (asset.resource_type === 'video') {
                videos.push(asset);
            } else {
                others.push(asset);
            }
        }
    });
    return { imageAssets: images, videoAssets: videos, otherAssets: others };
  }, [mediaAssets, activeLibrary]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canUpload) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to upload files.',
      });
      return;
    }
    setFilesToUpload(acceptedFiles);
    
    // If any of the files are videos, ask for format choice. Otherwise, just ask for library.
    if (acceptedFiles.some(file => file.type.startsWith('video/'))) {
        setIsChoosingVideoFormat(true);
    } else {
        setUploadVideoFormat('mp4'); // Default for non-videos
        setIsChoosingLibrary(true);
    }
  }, [canUpload, toast]);
  
  const handleLibraryChoiceAndUpload = useCallback(async (libraryId: 'primary' | 'extented') => {
    setIsChoosingLibrary(false);
    
    const suffix = libraryId === 'primary' ? '_1' : '_2';
    const cloudName = libraryId === 'primary' 
        ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1 
        : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
    
    if (!cloudName) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: `Cloudinary cloud name for library '${libraryId}' is not set.`,
            duration: 10000,
        });
        setFilesToUpload([]);
        return;
    }

    setIsUploading(true);

    for (const file of filesToUpload) {
        setUploadingFileName(file.name);
        setUploadProgress(0);

        const timestamp = Math.round((new Date()).getTime() / 1000);
        
        const uploadPreset = libraryId === 'primary'
            ? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1
            : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2;

        const paramsToSign = {
            timestamp: timestamp,
            upload_preset: uploadPreset || '',
        };
        
        let signatureResponse, apiKey;
        try {
            const sigRes = await fetch('/api/cloudinary-signature', {
                method: 'POST',
                body: JSON.stringify({ paramsToSign, libraryId }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!sigRes.ok) throw new Error('Failed to get signature from server.');
            const sigData = await sigRes.json();
            if (!sigData.success) throw new Error(sigData.message);
            signatureResponse = sigData.signature;
            apiKey = sigData.apiKey;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: `Upload Failed for ${file.name}`,
                description: `Could not get upload signature: ${error.message}`,
            });
            continue; // Skip to next file
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        Object.entries(paramsToSign).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });
        formData.append('signature', signatureResponse);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(progress);
            }
        };

        xhr.onload = async () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);

                let finalUrl = response.secure_url;
                if (response.resource_type === 'video' && uploadVideoFormat === 'm3u8') {
                    finalUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/v${response.version}/${response.public_id}.m3u8`;
                } else if (response.resource_type === 'video' || response.resource_type === 'image') {
                    finalUrl = finalUrl.replace(`/upload/`, `/upload/f_auto,q_auto/`);
                }

                if (firestore) {
                    const mediaData = {
                        public_id: response.public_id,
                        url: finalUrl,
                        resource_type: response.resource_type,
                        created_at: response.created_at,
                        filename: file.name,
                        libraryId: libraryId,
                        ...(response.resource_type === 'video' && { videoFormat: uploadVideoFormat }),
                    };

                    const docRefPromise = addDocumentNonBlocking(collection(firestore, 'media'), mediaData);
                    const docRef = await docRefPromise as DocumentReference | undefined;

                    if (docRef && !props.isDialog && props.onUploadComplete) {
                        props.onUploadComplete(docRef.id, response.resource_type, libraryId);
                    }
                }

                toast({
                    title: 'Upload successful',
                    description: `${file.name} has been uploaded to ${libraryId === 'primary' ? 'Library Primary' : 'Library Extented'}.`,
                });
            } else {
                const error = JSON.parse(xhr.responseText).error;
                toast({
                    variant: 'destructive',
                    title: `Upload Failed for ${file.name}`,
                    description: error.message || 'An unknown error occurred.',
                });
            }
        };

        xhr.onerror = () => {
            toast({
                variant: 'destructive',
                title: `Upload Failed for ${file.name}`,
                description: 'A network error occurred during upload.',
            });
        };

        xhr.send(formData);

        await new Promise(resolve => {
            xhr.onloadend = resolve;
        });
    }

    setIsUploading(false);
    setUploadingFileName('');
    setUploadProgress(0);
    setFilesToUpload([]);

  }, [filesToUpload, toast, firestore, props, uploadVideoFormat]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'text/vtt': ['.vtt'],
    },
    disabled: !canUpload || isUploading,
  });
  
  const handleDelete = async (publicId: string, docId: string, resourceType: string, libraryId: 'primary' | 'extented') => {
    if (!firestore || !canDelete) return;
    
    try {
        await deleteDocumentNonBlocking(doc(firestore, 'media', docId));
        toast({ title: "File Removed", description: `The reference to the file has been removed from your library.`});
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Deletion Failed", description: `Could not remove file reference: ${e.message}`});
    }
  };

  const handleSetLogo = (url: string) => {
    if (!firestore || !canEditContact) return;
    const contactDocRef = doc(firestore, 'contact', 'details');
    setDocumentNonBlocking(contactDocRef, { logoUrl: url }, { merge: true });
    toast({
        title: 'Logo Updated',
        description: 'The site logo has been successfully updated.',
    });
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "File URL copied to clipboard."});
  }

  const handleMediaSelect = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    if(props.isDialog) {
        props.onMediaSelect(url, type, filename);
        props.onSelectionComplete();
    } else if (props.onMediaSelect) {
        props.onMediaSelect(url, type, filename);
    }
  };
  
  const handleUrlUploadComplete = (mediaId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => {
    if (!props.isDialog && props.onUploadComplete) {
      props.onUploadComplete(mediaId, resourceType, libraryId);
    }
  };

  const handleOpenSetBackgroundDialog = (file: MediaAsset) => {
    if (!canEditHome) return;
    setBackgroundFile(file);
    setIsSetBackgroundOpen(true);
  };
  
  const handleConfirmSetBackground = async () => {
    if (!firestore || !backgroundFile || !canEditHome) return;

    let mediaIdForDb = backgroundFile.id;
    const mediaTypeForDb = backgroundFile.resource_type === 'video' ? 'video' : 'image';
    
    // If it's a video, ensure a project exists.
    if (mediaTypeForDb === 'video') {
        const projectsRef = collection(firestore, 'projects');
        const q = query(projectsRef, where("sourceUrl", "==", backgroundFile.url));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            mediaIdForDb = querySnapshot.docs[0].id;
        } else {
            const newProjectRef = doc(projectsRef);
            mediaIdForDb = newProjectRef.id;

            const batch = writeBatch(firestore);
            const title = backgroundFile.filename.split('.').slice(0, -1).join('.') || 'New Background Project';
            
            batch.set(newProjectRef, {
                title: title,
                description: "Automatically created for background video.",
                type: 'video',
                sourceUrl: backgroundFile.url,
                thumbnailUrl: backgroundFile.url.replace(/\.(mp4|m3u8|webm)$/, '.jpg'),
                isVisible: false,
                order: 999,
            });
            await batch.commit();
            toast({ title: 'Project Created', description: 'A hidden project was created for this background video.'});
        }
    }

    const settingsDocRef = doc(firestore, 'homepage', 'settings');
    const fieldToUpdateId = backgroundTarget === 'home' ? 'homePageBackgroundMediaId' : 'websiteBackgroundMediaId';
    const fieldToUpdateType = backgroundTarget === 'home' ? 'homePageBackgroundType' : 'websiteBackgroundType';
    
    setDocumentNonBlocking(settingsDocRef, { 
      [fieldToUpdateId]: mediaIdForDb,
      [fieldToUpdateType]: mediaTypeForDb,
    }, { merge: true });

    toast({
        title: 'Background Updated',
        description: `The background for the ${backgroundTarget === 'home' ? 'Homepage' : 'Other Pages'} has been set.`,
    });
    
    setIsSetBackgroundOpen(false);
  };


  const renderLibrary = (assets: MediaAsset[], type: 'image' | 'video' | 'raw') => {
    if (isLoadingMedia) {
        return (
            <div className="flex justify-center items-center h-full min-h-[200px]">
               <Preloader />
           </div>
       );
    }

    if (!assets || assets.length === 0) {
        const typeName = type === 'raw' ? 'files' : `${type}s`;
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FontAwesomeIcon icon={type === 'image' ? faFileImage : type === 'video' ? faFilm : faFileLines} className="h-12 w-12 mb-4" />
                <p>No {typeName} uploaded to this library yet.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {assets.map(file => (
                <MediaFileCard 
                  key={file.id} 
                  file={file} 
                  onDelete={handleDelete} 
                  onCopy={handleCopy}
                  onPreview={setPreviewFile}
                  onSetLogo={handleSetLogo}
                  onSetBackground={handleOpenSetBackgroundDialog}
                  isNewlyUploaded={file.id === newlyUploadedId}
                  onMediaSelect={handleMediaSelect}
                  isSelectionMode={!!(props.isDialog && props.isSelectionMode)}
                  canDelete={canDelete}
                  canEditContact={canEditContact}
                  canEditHome={canEditHome}
                />
            ))}
        </div>
    );
  }

  const renderPreviewContent = () => {
    if (!previewFile) return null;

    if (previewFile.resource_type === 'image') {
      return (
        <div className="relative w-full h-full">
          <Image
            src={previewFile.url}
            alt={previewFile.filename}
            fill
            className="object-contain"
          />
        </div>
      );
    }

    if (previewFile.resource_type === 'video' && previewFile.url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <CdnClapprPlayer 
            source={previewFile.url}
          />
        </div>
      );
    }
    return null;
  };

  const commonDialogContent = (
    <>
      <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="font-headline">{props.isDialog && props.isSelectionMode ? "Choose Media" : "Media Library"}</DialogTitle>
           <DialogDescription>Upload and manage your images and videos.</DialogDescription>
      </DialogHeader>
        <Tabs value={activeLibrary} onValueChange={(value) => setActiveLibrary(value as 'primary' | 'extented')} className='px-4 pt-4'>
            <TabsList>
                <TabsTrigger value="primary" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">Library Primary</TabsTrigger>
                <TabsTrigger value="extented" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">Library Extented</TabsTrigger>
            </TabsList>
        </Tabs>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'images' | 'videos' | 'files')} className="flex-1 flex flex-col min-h-0">
          <div className='px-4 pt-4'>
            <TabsList>
                <TabsTrigger value="images" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                    <FontAwesomeIcon icon={faFileImage} className="mr-2" />
                    Images
                </TabsTrigger>
                <TabsTrigger value="videos" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                    <FontAwesomeIcon icon={faFilm} className="mr-2" />
                    Videos
                </TabsTrigger>
                <TabsTrigger value="files" className="py-2 px-4 text-base glass-effect data-[state=active]:bg-destructive">
                    <FontAwesomeIcon icon={faFileLines} className="mr-2" />
                    Files
                </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-4 m-0">
                  {renderLibrary(imageAssets, 'image')}
              </TabsContent>
              <TabsContent value="videos" className="p-4 m-0">
                  {renderLibrary(videoAssets, 'video')}
              </TabsContent>
               <TabsContent value="files" className="p-4 m-0">
                  {renderLibrary(otherAssets, 'raw')}
              </TabsContent>
          </ScrollArea>
      </Tabs>
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
    </>
  );

  const previewDialog = (
    <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
      <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0">
        <DialogHeader className="absolute top-4 left-4 z-10">
          <DialogTitle className="text-white/80 font-headline">{previewFile?.filename}</DialogTitle>
        </DialogHeader>
        {renderPreviewContent()}
        <DialogClose className={cn(
          "absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-100 transition-opacity"
        )}>
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
  
  const setBackgroundDialog = (
    <Dialog open={isSetBackgroundOpen} onOpenChange={setIsSetBackgroundOpen}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>Set as Background</DialogTitle>
                <DialogDescription>
                    Where would you like to set this media as the background?
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <RadioGroup defaultValue="home" value={backgroundTarget} onValueChange={(value: 'home' | 'website') => setBackgroundTarget(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="home" id="bg-home" />
                        <Label htmlFor="bg-home">Homepage Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="website" id="bg-website" />
                        <Label htmlFor="bg-website">Other Pages</Label>
                    </div>
                </RadioGroup>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSetBackgroundOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmSetBackground}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  if (props.isDialog) {
      return (
        <>
          <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
              <DialogContent className="w-[80vw] h-[90vh] glass-effect p-0 flex flex-col">
                  {commonDialogContent}
              </DialogContent>
          </Dialog>
          {previewDialog}
           <AddFromUrlDialog
            isOpen={isAddFromUrlOpen}
            onOpenChange={setIsAddFromUrlOpen}
            onUploadComplete={handleUrlUploadComplete}
          />
          {setBackgroundDialog}
        </>
      );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-6">
        <div className="flex items-start justify-between">
            <div className="text-left">
                <h2 className="text-xl font-headline">Media Library</h2>
                <p className="text-muted-foreground mt-1 text-sm">Upload and manage your images and videos.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={props.onLibraryOpenRequest} variant="outline" size="sm">
                    <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
                    Browse Full Library
                </Button>
            </div>
        </div>
        <Separator className="bg-white/10" />
        <div className="border rounded-lg p-6 glass-effect flex flex-col gap-4">
            <div 
                {...getRootProps()} 
                className={cn(
                    'flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer', 
                    isDragActive && canUpload ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50', 
                    (!canUpload || isUploading) && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} disabled={!canUpload || isUploading} />
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
                    {isUploading ? (
                        <p className="text-sm">Uploading...</p>
                    ) : !canUpload ? (
                        <p className="text-sm text-destructive-foreground/70">You do not have permission to upload.</p>
                    ) : (
                       <p className="text-sm">Drag & drop files, or <span className="text-primary font-semibold">click to browse</span></p>
                    )}
                </div>
            </div>
            <Button onClick={() => setIsAddFromUrlOpen(true)} variant="outline" size="sm" className="w-full" disabled={!canUpload || isUploading}>
                <FontAwesomeIcon icon={faLink} className="mr-2" />
                Add from URL
            </Button>
          {isUploading && (
              <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    Uploading: {uploadingFileName} ({Math.round(uploadProgress)}%)
                  </p>
              </div>
          )}
        </div>
      </div>
      {previewDialog}
      {setBackgroundDialog}
      <AddFromUrlDialog
        isOpen={isAddFromUrlOpen}
        onOpenChange={setIsAddFromUrlOpen}
        onUploadComplete={handleUrlUploadComplete}
      />
      <Dialog open={isChoosingVideoFormat} onOpenChange={setIsChoosingVideoFormat}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>Choose Video Format</DialogTitle>
                <DialogDescription>Select the delivery format for the video(s) you are uploading.</DialogDescription>
            </DialogHeader>
            <RadioGroup defaultValue="mp4" onValueChange={(value: 'mp4' | 'm3u8') => setUploadVideoFormat(value)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mp4" id="r1" />
                    <Label htmlFor="r1">MP4 (Optimized for web)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="m3u8" id="r2" />
                    <Label htmlFor="r2">M3U8 (Adaptive streaming)</Label>
                </div>
            </RadioGroup>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsChoosingVideoFormat(false)}>Cancel</Button>
                <Button onClick={() => { setIsChoosingVideoFormat(false); setIsChoosingLibrary(true); }}>Next</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isChoosingLibrary} onOpenChange={setIsChoosingLibrary}>
        <DialogContent className="w-[80vw]">
            <DialogHeader>
                <DialogTitle>Choose a Library</DialogTitle>
                <DialogDescription>Select which Cloudinary library you want to upload the files to.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-4 py-4">
                <Button onClick={() => handleLibraryChoiceAndUpload('primary')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2"/> Library Primary</Button>
                <Button onClick={() => handleLibraryChoiceAndUpload('extented')} size="lg" className="w-48"><FontAwesomeIcon icon={faUniversity} className="mr-2"/> Library Extented</Button>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsChoosingLibrary(false)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
