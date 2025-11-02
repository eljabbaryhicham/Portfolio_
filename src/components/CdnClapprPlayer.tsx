
'use client';
import { useEffect, useRef, useState } from 'react';
import Preloader from './preloader';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Make Clappr and its plugins available on the window object for type safety
declare global {
    interface Window {
        Clappr: any;
        DashShakaPlayback: any;
        LevelSelector: any;
        HlsJsPlayback: any;
    }
}

interface CdnClapprPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  watermark?: string;
}

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`Failed to load script: ${src}.`));
        document.head.appendChild(script);
    });
};

const waitForGlobal = (name: string, timeout = 3000): Promise<void> => {
    return new Promise((resolve, reject) => {
        let waited = 0;
        const interval = 100;
        const check = () => {
            if ((window as any)[name]) {
                resolve();
            } else if (waited >= timeout) {
                reject(new Error(`Timed out waiting for global variable '${name}'`));
            } else {
                waited += interval;
                setTimeout(check, interval);
            }
        };
        check();
    });
};


export default function CdnClapprPlayer({ source, poster, autoPlay = true, watermark }: CdnClapprPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      const container = playerContainerRef.current;
      if (!container) return;
      setIsLoading(true);

      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js', 'clappr-script');
        await waitForGlobal('Clappr');
        
        if (!isMounted) return;

        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/gh/clappr/dash-shaka-playback@latest/dist/dash-shaka-playback.js', 'clappr-shaka-playback'),
            loadScript('https://cdn.jsdelivr.net/gh/clappr/clappr-level-selector-plugin@latest/dist/level-selector.min.js', 'clappr-level-selector'),
            loadScript('https://cdn.jsdelivr.net/npm/@clappr/hlsjs-playback@latest/dist/hlsjs-playback.min.js', 'clappr-hls-playback'),
        ]);

        if (!isMounted || !container) return;
        
        const plugins = [];
        if (window.DashShakaPlayback) plugins.push(window.DashShakaPlayback);
        if (window.LevelSelector) plugins.push(window.LevelSelector);
        if (window.HlsJsPlayback) plugins.push(window.HlsJsPlayback);

        const playerButtons = isMobile
          ? ['play', 'pip', 'fullscreen']
          : ['play', 'volume', 'pip', 'fullscreen'];

        const newPlayer = new window.Clappr.Player({
            parentId: `#${container.id}`,
            source,
            poster,
            width: '100%',
            height: '100%',
            autoPlay: autoPlay,
            volume: 10,
            watermark: watermark || '',
            watermarkLink: undefined,
            clickToToggle: true,
            playback: {
              playInline: true,
            },
            plugins: plugins,
            shakaConfiguration: {
              streaming: {
                rebufferingGoal: 15
              }
            },
            hlsjsConfig: {
              // HLS.js configuration options
            },
            mediacontrol: {
              seekbar: "hsl(var(--destructive))",
              buttons: playerButtons,
            },
            levelSelectorConfig: {
              title: 'Quality',
              labels: {
                  2: 'High', // e.g., 1080p
                  1: 'Med', // e.g., 720p
                  0: 'Low', // e.g., 360p
              },
            },
            playbackRateConfig: {
                defaultRate: 1.0,
                rates: [0.5, 1.0, 1.5, 2.0]
            },
            events: {
              onReady: () => {
                if (isMounted) setIsLoading(false)
              },
              onPlay: () => {
                if (isMounted) setIsLoading(false)
              },
              onError: (e: any) => {
                if (isMounted) {
                  setIsLoading(false);
                  console.error("Clappr player error:", e);
                }
              },
            }
        });
        
        playerRef.current = newPlayer;

      } catch (error: any) {
        console.error(error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Could not load video player',
            description: error.message || 'An essential script for video playback failed to load. Please check your internet connection or ad-blocker.',
            duration: 9000,
          });
          setIsLoading(false);
        }
      }
    };
    
    initPlayer();

    return () => {
      isMounted = false;
      const player = playerRef.current;
      if (player) {
        try {
           player.stop();
           player.destroy();
        } catch (e) {
          console.error("Error destroying Clappr player:", e);
        }
      }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]); 

  // Effect to control playback based on autoPlay prop
  useEffect(() => {
    const player = playerRef.current;
    if (player && player.core) { // Ensure player core is available
      if (autoPlay) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [autoPlay, isLoading]); // Re-run when isLoading changes to ensure play is called after ready

  return (
    <div className="w-full h-full relative bg-black">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Preloader />
        </div>
      )}
      <div 
        id={`cdn-clappr-player-${Math.random().toString(36).substring(7)}`}
        ref={playerContainerRef} 
        className={cn("w-full h-full transition-opacity duration-300", isLoading ? 'opacity-0' : 'opacity-100')} 
      />
    </div>
  );
}
