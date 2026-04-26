import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 ${className}`}
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      {children}
    </motion.div>
  );
};

export default Card;