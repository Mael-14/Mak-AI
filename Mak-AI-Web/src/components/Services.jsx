import React, { useMemo } from 'react'
import assets from '../assets/assets'
import Title from './Title'
import ServiceCard from './ServiceCard'
import {motion} from 'motion/react'

const Services = () => {

    const servicesData = [
      {
        title: 'Topic-based revision',
        description: 'Comprehensive archeive of past GCE examination questions organised by subject and topic',
        icon: 'menu_book'
      },
      {
        title: 'Ai-powered learning',
        description: 'Ai assistant to explanation from complex concepts to simple terms.',
        icon: 'psychology'
      },
      {
        title: 'Smart progress tracking',
        description: 'Monitor overall performance and improvements and obtain accuracy rates',
        icon: 'trending_up',
      },
      {
        title: 'Exam Strategy and motivational tools',
        description: 'Revision planners and study schedules.',
        icon: 'event_note',
      },
      {
        title: 'Offline access',
        description: 'Download questions and study without internet connection.',
        icon: 'download',
      },
      {
        title: 'Local curriculum alignment',
        description: 'Specifically designed for GCE students to align with the curriculum.',
        icon: 'school',
      },
      {
        title: 'Exam simulation',
        description: 'Mock and passed GCE exams to simulate real exam conditions.',
        icon: 'quiz',
      }
    ]

    // Function to shuffle array randomly
    const shuffleArray = (array) => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // Create shuffled arrays for each row (different randomizations)
    const leftRowData = useMemo(() => {
      return shuffleArray(servicesData)
    }, [])

    const rightRowData = useMemo(() => {
      return shuffleArray(servicesData)
    }, [])

    // Create enough duplicates for seamless infinite scroll (8 copies for smoother loop)
    const leftRowItems = useMemo(() => {
      return [...leftRowData, ...leftRowData, ...leftRowData, ...leftRowData, ...leftRowData, ...leftRowData, ...leftRowData, ...leftRowData]
    }, [leftRowData])

    const rightRowItems = useMemo(() => {
      return [...rightRowData, ...rightRowData, ...rightRowData, ...rightRowData, ...rightRowData, ...rightRowData, ...rightRowData, ...rightRowData]
    }, [rightRowData])

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.2 }}
      
    id='services' className='relative flex flex-col items-center gap-7 px-1 sm:px-12 lg:px-24 xl:px-40 pt-2 text-gray-700 dark:text-white'>
        
        <img src={assets.bgImage2} alt="" className='absolute -top-110 -left-70 -z-1 dark:hidden'/>

    <Title title='How can we help?' desc='From uncertainty to mastery. We assist you in your journey to success.'/>

    <div className='relative w-full overflow-hidden py-4'>
      {/* First row: Left to Right */}
      <div className='flex gap-5 mb-5 animate-scroll-left'>
        {leftRowItems.map((service, index)=>(
          <div key={`left-${index}`} className='flex-shrink-0'>
            <ServiceCard service={service} index={index % servicesData.length}/>
          </div>
        ))}
      </div>
      
      {/* Second row: Right to Left */}
      <div className='flex gap-5 animate-scroll-right'>
        {rightRowItems.map((service, index)=>(
          <div key={`right-${index}`} className='flex-shrink-0'>
            <ServiceCard service={service} index={index % servicesData.length}/>
          </div>
        ))}
      </div>
    </div>

    </motion.div>
  )
}

export default Services


