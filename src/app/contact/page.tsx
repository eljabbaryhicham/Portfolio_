'use client';

import dynamic from 'next/dynamic'
import Preloader from '@/components/preloader'

const ContactPage = dynamic(() => import('@/features/contact/components/ContactPage'), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Preloader />
    </div>
  ),
  ssr: false,
})

export default ContactPage
