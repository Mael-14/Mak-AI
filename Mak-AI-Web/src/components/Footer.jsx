import React from 'react'
import assets from '../assets/assets'
import {motion} from 'motion/react'

const Footer = ({theme}) => {
  return (
    <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    className='bg-slate-50 dark:bg-gray-900 pt-10 sm:pt-10 mt-5 sm:mt-5 px-4 sm:px-10 lg:px-24 xl:px-40'>
      {/* footer top  */}
      <div className='flex justify-between lg:items-center max-lg:flex-col gap-10'>

        <motion.div 
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className='space-y-5 text-sm text-gray-700 dark:text-gray-400'>
            <img src={theme === 'dark' ? assets.logo2 : assets.logo2} className='w-32 sm:w-44' alt="" />
            <p className='max-w-md'>From concept to comprehension, we deliver personalized learning solutions.</p>

            <ul className='flex gap-8'>
                <li><a className='hover:text-primary' href="#hero">Home</a></li>
                <li><a className='hover:text-primary' href="#services">Services</a></li>
                <li><a className='hover:text-primary' href="#our-work">How it works</a></li>
                <li><a className='hover:text-primary' href="#contact-us">Contact Us</a></li>
            </ul>
        </motion.div>
       
      </div>
      <hr className='border-gray-300 dark:border-gray-600  my-6'/>

      {/* footer bottom */}
      <motion.div 
      initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    viewport={{ once: true }}
      className='pb-6 text-sm text-gray-500 flex justify-center sm:justify-between gap-4 flex-wrap'>
        <p>Copyright 2025 © Mak-AI - All Right Reserved.</p>
        <div className='flex items-center justify-between gap-4'>
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.instagram_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Footer
