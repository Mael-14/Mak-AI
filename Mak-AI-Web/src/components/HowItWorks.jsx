import React from 'react'
import Title from './Title'
import assets from '../assets/assets'
import {motion} from 'motion/react'
import { getAppStoreLink } from '../utils/appStoreUtils'

const HowItWorks = () => {

    const workData = [
        {
            title: 'Download Mak-AI',
            description: 'Search and download the Mak-AI app into your phone from from the App Store or Google Play Store.',
            image: assets.work_mobile_app,
            iosLink: 'https://apps.apple.com/your-app-link',  // iOS App Store link
            androidLink: 'https://play.google.com/your-app-link'  // Google Play Store link
        },
        {
            title: 'Register and study',
            description: 'Create an account and start studying with all the available tools.',
            image: assets.work_mobile_app2
        },
        {
            title: 'Succeed with Mak-AI',
            description: 'Get ready and obtain your desired results with Mak-AI.',
            image: assets.succeed
        },
    ]

    // Handle card click
    const handleCardClick = (work) => {
        if (work.iosLink || work.androidLink) {
            const link = getAppStoreLink(work.iosLink, work.androidLink);
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    }

    // Handle title link click (prevents card click from also firing)
    const handleTitleClick = (e, work) => {
        e.stopPropagation(); // Prevent card click
        if (work.iosLink || work.androidLink) {
            const link = getAppStoreLink(work.iosLink, work.androidLink);
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    }

  return (
    <motion.div 
        initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.2 }}
    id='how-it-works' className='flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 xl:px-40 pt-30 text-gray-700 dark:text-white'>
      <Title title='How it works?' desc='From learning gaps to learning gains, we bridge the path to achievement.'/>

    <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl'>
        {
            workData.map((work, index)=>(
                <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                key={index} 
                onClick={() => handleCardClick(work)}
                className={`relative group hover:scale-102 duration-500 transition-all ${(work.iosLink || work.androidLink) ? 'cursor-pointer' : ''}`}>
                    <div className='relative overflow-hidden rounded-xl'>
                        <img src={work.image} className='w-full rounded-xl' alt="" />
                        {/* Hover overlay for first card */}
                        {index === 0 && (work.iosLink || work.androidLink) && (
                            <div className='absolute inset-0 bg-black/70 dark:bg-black/80 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                <p className='text-white text-lg font-semibold'>Download Mak-AI here</p>
                            </div>
                        )}
                    </div>
                    {(work.iosLink || work.androidLink) ? (
                        <a 
                            href={getAppStoreLink(work.iosLink, work.androidLink)}
                            onClick={(e) => handleTitleClick(e, work)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className='mt-3 mb-2 text-lg font-semibold text-primary hover:text-primary/80 hover:underline transition-all duration-300 block'
                        >
                            {work.title}
                        </a>
                    ) : (
                        <h3 className='mt-3 mb-2 text-lg font-semibold'>{work.title}</h3>
                    )}
                    <p className='text-sm opacity-60 w-5/6'>{work.description}</p>
                </motion.div>
            ))
        }
    </div>
    
    {/* YouTube Video */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className='w-full max-w-4xl mt-10'
    >
      <div className='relative w-full pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-2xl'>
        <iframe
          className='absolute top-0 left-0 w-full h-full'
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Mak-AI Tutorial"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </motion.div>

    </motion.div>

  )
}

export default HowItWorks
