'use client';

import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import Preloader from '@/components/preloader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faShieldHalved, faPlusCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { AppUser } from '@/firebase/auth/use-user';
import NewAdminForm from './NewAdminForm';
import { deleteAdminUser } from '@/app/actions/delete-admin';


interface AdminUser {
    id: string;
    uid: string;
    username: string;
    email: string;
    role: 'admin' | 'superadmin';
    createdAt: string;
    permissions: {
      canUploadMedia: boolean;
      canDeleteMedia: boolean;
      canEditProjects: boolean;
      canEditAbout: boolean;
      canEditContact: boolean;
      canEditHome: boolean;
    }
}
type Permissions = AdminUser['permissions'];

function PermissionsDialog({ user, isOpen, onOpenChange, onSave }: { user: AdminUser, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (permissions: Permissions) => void }) {
    const [permissions, setPermissions] = useState<Permissions>(user.permissions || {});
    
    const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
        setPermissions(prev => ({ ...prev, [permission]: value }));
    };

    const handleSave = () => {
        onSave(permissions);
        onOpenChange(false);
    };

    const permissionItems: { key: keyof Permissions, label: string }[] = [
        { key: 'canUploadMedia', label: 'Upload Media' },
        { key: 'canDeleteMedia', label: 'Delete Media' },
        { key: 'canEditProjects', label: 'Edit Projects' },
        { key: 'canEditAbout', label: 'Edit About' },
        { key: 'canEditContact', label: 'Edit Contact' },
        { key: 'canEditHome', label: 'Edit Home' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[80vw] glass-effect">
                <DialogHeader>
                    <DialogTitle className="font-headline">Edit Permissions for {user.username}</DialogTitle>
                    <DialogDescription>
                        Control what this admin user can and cannot do.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {permissionItems.map(({ key, label }) => (
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm glass-effect" key={key}>
                            <Label htmlFor={`${key}-${user.id}`} className='text-sm font-medium leading-none'>{label}</Label>
                            <Switch
                                id={`${key}-${user.id}`}
                                checked={permissions[key] ?? true}
                                onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                            />
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Permissions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminManagement() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('username', 'asc')) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<AdminUser>(usersQuery);
  
  const typedUser = currentUser as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<AdminUser | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);


  const displayedUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const handleRemoveFromList = (userId: string, username: string) => {
    if (!firestore || !isSuperAdmin) return;
    
    deleteDocumentNonBlocking(doc(firestore, 'users', userId));

    toast({
        title: `Admin '${username}' Removed`,
        description: 'The user has been removed from the list. Their authentication record still exists.',
    });
  }

  const handleFullDelete = async (userId: string, username: string) => {
    if (!isSuperAdmin) return;
    const result = await deleteAdminUser(userId);
    if (result.success) {
      toast({
        title: `Admin '${username}' Fully Deleted`,
        description: 'The user has been deleted from Authentication and Firestore.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: result.error,
      });
    }
  }
  
  const handleOpenPermissions = (user: AdminUser) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleSavePermissions = (permissions: Permissions) => {
    if (!firestore || !isSuperAdmin || !selectedUserForPermissions) return;
    const userDocRef = doc(firestore, 'users', selectedUserForPermissions.id);
    updateDocumentNonBlocking(userDocRef, { permissions });
    toast({
        title: 'Permissions Updated',
        description: `Permissions for ${selectedUserForPermissions.username} have been saved.`,
    });
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="mb-6 flex items-start justify-between">
            <div>
                <h2 className="text-xl font-headline">Admin Management</h2>
                <p className="text-muted-foreground">View and manage administrator accounts and permissions.</p>
            </div>
             {isSuperAdmin && (
                <Button onClick={() => setIsAddAdminDialogOpen(true)} size="sm">
                    <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                    New Admin
                </Button>
            )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-full min-h-96">
              <Preloader />
          </div>
        )}
        
        {!isLoading && (
          <div className="flex-1 flex flex-col min-h-0">
              {/* Mobile View */}
              <div className="md:hidden flex-1 border rounded-lg overflow-hidden glass-effect">
                <ScrollArea className='h-full'>
                  <div className='p-4 space-y-4'>
                      {displayedUsers.map((user) => (
                          <div key={user.id} className="p-4 rounded-lg bg-black/10 border border-white/10">
                              <div className='flex justify-between items-start'>
                                  <div>
                                      <p className="font-bold">{user.username}</p>
                                      <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                  <Badge variant={user.email === 'eljabbaryhicham@example.com' ? 'destructive' : 'secondary'} className="ml-2 whitespace-nowrap">
                                      {user.email === 'eljabbaryhicham@example.com' ? 'Super Admin' : 'Admin'}
                                  </Badge>
                              </div>
                              <Separator className="my-4 bg-white/10" />
                              <div className='flex justify-between items-center'>
                                  {user.email !== 'eljabbaryhicham@example.com' ? (
                                      <Button variant="outline" size="sm" onClick={() => handleOpenPermissions(user)} disabled={!isSuperAdmin}>
                                          <FontAwesomeIcon icon={faShieldHalved} className="mr-2 h-4 w-4" />
                                          Permissions
                                      </Button>
                                  ) : <div />}
                                  {user.email !== 'eljabbaryhicham@example.com' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={!isSuperAdmin}>
                                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete {user.username}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Choose how you want to remove this admin user. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="sm:justify-between gap-2">
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                  <AlertDialogAction onClick={() => handleRemoveFromList(user.id, user.username)} className="bg-yellow-600 hover:bg-yellow-700">Remove from List Only</AlertDialogAction>
                                                  <AlertDialogAction onClick={() => handleFullDelete(user.uid, user.username)} className="bg-destructive hover:bg-destructive/90">Fully Revoke Access</AlertDialogAction>
                                                </div>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block flex-1 rounded-lg overflow-hidden glass-effect">
                <ScrollArea className='h-full'>
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-center">Permissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {displayedUsers.map((user) => (
                          <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                              <Badge variant={user.email === 'eljabbaryhicham@example.com' ? 'destructive' : 'secondary'}>
                              {user.email === 'eljabbaryhicham@example.com' ? 'Super Admin' : 'Admin'}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                              {user.email !== 'eljabbaryhicham@example.com' ? (
                                <Button variant="outline" size="sm" onClick={() => handleOpenPermissions(user)} disabled={!isSuperAdmin}>
                                  <FontAwesomeIcon icon={faShieldHalved} className="mr-2 h-4 w-4" />
                                  Manage
                                </Button>
                              ) : (
                                <p className="text-sm text-muted-foreground">All Permissions</p>
                              )}
                          </TableCell>
                          <TableCell className="text-right">
                              {user.email !== 'eljabbaryhicham@example.com' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={!isSuperAdmin}>
                                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete {user.username}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Choose how you want to remove this admin user. "Fully Revoke Access" is permanent.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="sm:justify-between gap-2">
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <AlertDialogAction onClick={() => handleRemoveFromList(user.id, user.username)} className="bg-yellow-600 hover:bg-yellow-700 text-white">Remove from List</AlertDialogAction>
                                                <AlertDialogAction onClick={() => handleFullDelete(user.uid, user.username)} className="bg-destructive hover:bg-destructive/90 text-white">Fully Revoke Access</AlertDialogAction>
                                            </div>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              )}
                          </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
                  </ScrollArea>
              </div>
              
              {!isLoading && displayedUsers.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                      No admin users found.
                  </div>
              )}
          </div>
        )}
      </div>
      
      {selectedUserForPermissions && (
        <PermissionsDialog 
          user={selectedUserForPermissions} 
          isOpen={isPermissionsDialogOpen} 
          onOpenChange={setIsPermissionsDialogOpen}
          onSave={handleSavePermissions} 
        />
      )}

       <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
        <DialogContent className="w-[80vw] glass-effect">
            <DialogHeader>
                <DialogTitle className="font-headline">Create New Admin</DialogTitle>
                <DialogDescription>
                    Enter a username and password to create a new administrator account.
                </DialogDescription>
            </DialogHeader>
            <NewAdminForm onSuccess={() => setIsAddAdminDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
