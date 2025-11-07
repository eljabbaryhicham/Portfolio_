
'use client';

import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@/components/icon';
import { faLinkedin, faBehance, faInstagram, faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ContactForm from './ContactForm';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { defaultEmailTemplate } from '@/features/admin/components/HomeAdmin';
import { useI18n } from '@/context/i18n-context';


interface ContactInfo {
  avatarUrl?: string;
  name?: string;
  title?: string;
  email?: string;
  whatsApp?: string;
  behanceUrl?: string;
  linkedinUrl?: string;
  fiverrUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  avatarScale?: number;
}

interface HomePageSettings {
    emailFromName?: string;
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};


export default function ContactPage() {
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const contactDocRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'contact', 'details') : null,
    [firestore]
  );
  const { data: contactInfo, isLoading: isContactLoading } = useDoc<ContactInfo>(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isSettingsLoading } = useDoc<HomePageSettings>(settingsDocRef);


  const isLoading = isContactLoading || isSettingsLoading;

  const contactLinks = contactInfo ? [
    { icon: faEnvelope, label: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}`, color: 'hover:text-blue-300' },
    { icon: faBehance, label: 'Behance', value: '@BeLofted', href: contactInfo.behanceUrl, color: 'hover:text-purple-300' },
    { icon: faLinkedin, label: 'LinkedIn', value: 'Hicham Eljabbary', href: contactInfo.linkedinUrl, color: 'hover:text-sky-300' },
  ] : [];

  const socialLinks = contactInfo ? [
    { id: 'instagram', href: contactInfo.instagramUrl, icon: faInstagram, hoverColor: 'hover:text-pink-500' },
    { id: 'facebook', href: contactInfo.facebookUrl, icon: faFacebook, hoverColor: 'hover:text-blue-600' },
    { id: 'twitter', href: contactInfo.twitterUrl, icon: faTwitter, hoverColor: 'hover:text-sky-500' },
  ].filter(link => link.href) : [];

  const avatarUrl = contactInfo?.avatarUrl || "https://i.imgur.com/N9c8oEJ.png";
  const avatarScale = contactInfo?.avatarScale || 1;

  const emailFromName = homeSettings?.emailFromName || 'BELOFTED';
  const emailTemplate = homeSettings?.emailHtmlTemplate || defaultEmailTemplate;
  const emailLogoUrl = homeSettings?.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png';
  const emailLogoScale = homeSettings?.emailLogoScale || 1;

  return (
    <div className="h-full w-full flex flex-col">
      {!isLoading && <ScrollIndicator scrollRef={scrollRef} />}
      <div className="p-8 flex-shrink-0">
        <div className="container mx-auto px-0">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{t('contact.title')}</h1>
            <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
              {t('contact.description')}
            </p>
          </div>
        </div>
      </div>
      <Separator className="bg-white/10 flex-shrink-0" />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="p-8 flex items-center justify-center min-h-full">
            <div className="container mx-auto px-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Preloader />
                </div>
              ) : (
                <motion.div
                  className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center text-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div className="w-full md:w-1/2 flex justify-center" variants={itemVariants}>
                    <Card className="glass-effect p-6 sm:p-8 h-full flex flex-col justify-center w-full max-w-md">
                      <CardContent className="p-0 flex flex-col items-center">
                          <ContactForm 
                            emailFromName={emailFromName}
                            emailHtmlTemplate={emailTemplate}
                            emailLogoUrl={emailLogoUrl}
                            emailLogoScale={emailLogoScale}
                          />
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div className="w-full md:w-1/2 flex justify-center" variants={itemVariants}>
                    <Card className="glass-effect p-6 flex flex-col h-full w-full max-w-md">
                      <CardContent className="flex flex-col items-center text-center p-0">
                        <Avatar className="w-32 h-32 mb-4 border-2 border-primary">
                           <AvatarImage 
                              src={avatarUrl} 
                              alt="Avatar" 
                              style={{ 
                                transform: `scale(${avatarScale})`, 
                                objectFit: 'contain' 
                              }} 
                            />
                          <AvatarFallback>
                            <Preloader />
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg md:text-xl font-headline">{contactInfo?.name}</h3>
                        <p className="text-sm md:text-base text-foreground/70">{contactInfo?.title}</p>
                        
                        <Separator className="my-4 bg-white/20" />
                        
                        <div className="w-full flex flex-col items-center">
                          <div className="space-y-4">
                              {contactLinks.map((link) => (
                              link.href && link.value && (
                                  <Link
                                    href={link.href}
                                    key={link.label}
                                    className="flex flex-col text-center items-center md:flex-row md:text-left group text-white"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                      <div className={cn("w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full flex items-center justify-center glass-effect transition-colors duration-300 text-white", link.color)}>
                                          <Icon icon={link.icon} className="w-5 h-5 md:w-6 md:h-6" />
                                      </div>
                                      <div className="mt-2 md:mt-0 md:ml-4 break-words">
                                          <p className="text-xs md:text-sm text-foreground/70">{link.label}</p>
                                          <p className="text-sm md:text-base font-medium group-hover:text-primary transition-colors">{link.value}</p>
                                      </div>
                                  </Link>
                              )
                              ))}
                          </div>
                        </div>
                        
                        {contactInfo?.whatsApp && (
                          <>
                            <Separator className="my-4 bg-white/20" />
                            <div className="flex justify-center">
                                <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 animate-shake" size="lg">
                                    <Link href={`https://wa.me/${contactInfo.whatsApp.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5" />
                                        <div className="text-left">
                                            <p className="text-xs font-light leading-tight">WhatsApp</p>
                                            <p className="font-semibold text-sm leading-tight">{contactInfo.whatsApp}</p>
                                        </div>
                                    </Link>
                                </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
              {contactInfo && (
                <motion.div 
                  className="flex items-center justify-center gap-4 mt-8 flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5}}
                >
                  {socialLinks.map((social) => (
                    social.href && (
                      <Link 
                        href={social.href} 
                        key={social.id} 
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 glass-effect",
                          social.hoverColor
                        )}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <FontAwesomeIcon icon={social.icon} className="w-5 h-5 md:w-6 md:h-6" />
                      </Link>
                    )
                  ))}
                </motion.div>
              )}
            </div>
        </div>
    </div>
    </div>
  );
}
