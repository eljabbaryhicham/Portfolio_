
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { defaultPortfolioItems, type PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEllipsisH, faCloudUploadAlt, faGripVertical, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Preloader from '@/components/preloader';
import type { AppUser } from '@/firebase/auth/use-user';

interface ProjectAdminProps {
  setSelectedItem: (item: PortfolioItem | null) => void;
  setIsSheetOpen: (isOpen: boolean) => void;
}


function ProjectAdmin({ setSelectedItem, setIsSheetOpen }: ProjectAdminProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);

  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: items, isLoading } = useCollection<PortfolioItem>(projectsCollection);

  const [sortedItems, setSortedItems] = useState<PortfolioItem[]>([]);
  
  const draggingItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (items) {
      const newSortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSortedItems(newSortedItems);
    }
  }, [items]);

  const handleSeedData = async () => {
    if (!firestore || !canEditProjects) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to seed data.' });
        return;
    }
    const batch = writeBatch(firestore);
    const projectsCol = collection(firestore, 'projects');

    defaultPortfolioItems.forEach((item) => {
        const docRef = doc(projectsCol, item.id);
        batch.set(docRef, item);
    });

    try {
        await batch.commit();
        toast({ title: 'Success', description: 'Default projects have been added.' });
    } catch (e: any) {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: 'projects',
            operation: 'write',
            requestResourceData: { note: `Batch write for seeding ${defaultPortfolioItems.length} documents.` },
          })
        );
    }
  }

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsSheetOpen(true);
  };

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };
  
  const handleDeleteItem = (id: string) => {
    if (!firestore || !canEditProjects) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', id));
    toast({
      title: 'Item Deleted',
      description: 'The portfolio item has been removed.',
    });
  };

  const handleToggleVisibility = (item: PortfolioItem) => {
    if (!firestore || !canEditProjects) return;
    const docRef = doc(firestore, 'projects', item.id);
    const newVisibility = !(item.isVisible ?? true);
    updateDocumentNonBlocking(docRef, { isVisible: newVisibility });
    toast({
        title: `Project ${newVisibility ? 'Visible' : 'Hidden'}`,
        description: `"${item.title}" is now ${newVisibility ? 'visible' : 'hidden'} on the work page.`,
    });
  };

  const handleDragEnd = () => {
    if (!firestore || !canEditProjects) return;

    const draggingId = draggingItem.current;
    const dragOverId = dragOverItem.current;

    draggingItem.current = null;
    dragOverItem.current = null;
    
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
    document.querySelectorAll('.drag-over-bottom').forEach(el => el.classList.remove('drag-over-bottom'));


    if (!draggingId || !dragOverId || draggingId === dragOverId) {
      return;
    }
    
    const dragIndex = sortedItems.findIndex(item => item.id === draggingId);
    const hoverIndex = sortedItems.findIndex(item => item.id === dragOverId);

    if (dragIndex === -1 || hoverIndex === -1) return;

    const newSortedItems = [...sortedItems];
    const [draggedItem] = newSortedItems.splice(dragIndex, 1);
    newSortedItems.splice(hoverIndex, 0, draggedItem);
    
    setSortedItems(newSortedItems);

    const batch = writeBatch(firestore);
    newSortedItems.forEach((item, index) => {
        const docRef = doc(firestore, 'projects', item.id);
        if (item.order !== index) {
            batch.update(docRef, { order: index });
        }
    });

    batch.commit().then(() => {
        toast({ title: "Reordered!", description: "Project order has been updated." });
    }).catch(e => {
        // Reset local state on failure
        if (items) {
          setSortedItems([...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }

        // Emit a contextual error for debugging security rules
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: 'projects', // The path for a batch write is ambiguous, so we use the collection name.
            operation: 'update',
            requestResourceData: { note: `Batch update to reorder ${newSortedItems.length} documents.` },
          })
        );
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    if (!canEditProjects) return;
    dragOverItem.current = id;
    const target = e.currentTarget as HTMLTableRowElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    target.parentElement?.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    if (e.clientY < midpoint) {
      target.classList.add('drag-over-top');
    } else {
      target.classList.add('drag-over-bottom');
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
            <div className="text-left">
                <h2 className="text-xl font-headline">Portfolio Projects</h2>
                <p className="text-muted-foreground">
                Add, edit, and reorder the projects in your portfolio.
                </p>
            </div>
            <div className="flex items-center gap-2">
                {!isLoading && items?.length === 0 && (
                <Button onClick={handleSeedData} variant="secondary" size="sm" disabled={!canEditProjects}>
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2 h-4 w-4" />
                    Seed Projects
                </Button>
                )}
                <Button onClick={handleAddItem} size="sm" disabled={!canEditProjects}>
                <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                Add New
                </Button>
            </div>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
        <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center"></TableHead>
                  <TableHead className="w-[80px] text-center">Image</TableHead>
                  <TableHead className="text-center">Title</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Type</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Description</TableHead>
                  <TableHead className="text-center w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-96">
                      <div className="flex justify-center items-center h-full">
                        <Preloader />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedItems && sortedItems.map((item) => (
                  <TableRow 
                    key={item.id} 
                    draggable={canEditProjects}
                    onDragStart={(e) => {
                      if (!canEditProjects) return;
                      draggingItem.current = item.id;
                      e.currentTarget.classList.add('dragging');
                    }}
                    onDragEnter={(e) => handleDragEnter(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                        "border-b-0 transition-all relative", 
                        canEditProjects && "cursor-grab",
                        (item.isVisible === false) && "opacity-50 hover:opacity-80"
                    )}
                  >
                    <TableCell className="text-center">
                      <FontAwesomeIcon icon={faGripVertical} className={cn("h-5 w-5 text-foreground/50", !canEditProjects && "opacity-20")} />
                    </TableCell>
                    <TableCell className="flex justify-center">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        width={50}
                        height={50}
                        className="object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate text-center">{item.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{item.type}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate text-center">{item.description}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(item)} disabled={!canEditProjects} title={item.isVisible === false ? "Show Project" : "Hide Project"}>
                            <FontAwesomeIcon icon={item.isVisible === false ? faEyeSlash : faEye} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <FontAwesomeIcon icon={faEllipsisH} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="glass-effect">
                              <DropdownMenuItem onClick={() => handleEditItem(item)} className="justify-center">
                                {canEditProjects ? 'Edit' : 'View'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive justify-center"
                                disabled={!canEditProjects}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

export default ProjectAdmin;
