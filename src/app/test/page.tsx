
'use client';

import { useState, useEffect, useMemo } from 'react';
import CdnClapprPlayer from '@/components/CdnClapprPlayer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import Preloader from '@/components/preloader';
import { doc } from 'firebase/firestore';
import PlyrPlayer from '@/components/PlyrPlayer';
import type { AppUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';

interface HomePageSettings {
    workPagePlayer?: 'plyr' | 'clappr';
}

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultUrl = 'https://res.cloudinary.com/da1srnoer/video/upload/sp_auto/v1761114792/u7h3zjwcglk5vzlxwiaq.m3u8';
  const [source, setSource] = useState(defaultUrl);
  const [inputValue, setInputValue] = useState(defaultUrl);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
  const workPagePlayer = homeSettings?.workPagePlayer || 'clappr';


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);


  const handleLoadClick = () => {
    setSource(inputValue);
  };
  
  const handleSwitchPlayer = () => {
    if (!settingsDocRef || !isSuperAdmin) return;
    const newPlayer =
      homeSettings?.workPagePlayer === 'plyr' ? 'clappr' : 'plyr';
    setDocumentNonBlocking(settingsDocRef, { workPagePlayer: newPlayer }, { merge: true });
    toast({
      title: 'Player Switched',
      description: `Default player is now ${
        newPlayer.charAt(0).toUpperCase() + newPlayer.slice(1)
      }.`,
    });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Preloader />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8">
      <div className='w-full flex flex-col items-center justify-center'>
        <div className="text-center mb-8 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline tracking-tight">Streaming Test</h1>
          <p className="mt-2 text-base md:text-lg text-foreground/70">
            The active player is <span className='font-bold text-primary'>{workPagePlayer.charAt(0).toUpperCase() + workPagePlayer.slice(1)}</span>. Enter a video URL to test playback.
          </p>
          <div className="mt-4 flex w-full items-center space-x-2">
            <Input
              type="url"
              placeholder="Enter video URL..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="text-base"
            />
            <Button type="submit" onClick={handleLoadClick}>
              <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
              Load
            </Button>
          </div>
        </div>
        
        {isSuperAdmin && (
          <div className="mb-4">
             <Button
                variant="default"
                size="sm"
                onClick={handleSwitchPlayer}
                title="Switch Default Player"
              >
                <FontAwesomeIcon icon={faSyncAlt} className="mr-2 h-4 w-4" />
                Switch Player
              </Button>
          </div>
        )}

        <Separator className="bg-white/10 w-full max-w-4xl mb-8" />

        <div className="w-full max-w-4xl aspect-video bg-black">
          {workPagePlayer === 'clappr' ? (
              <CdnClapprPlayer key={source} source={source} autoPlay={true} />
          ) : (
              <PlyrPlayer key={source} source={source} autoPlay={true} />
          )}
        </div>
      </div>
    </div>
  );
}
