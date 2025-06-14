import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionFieldProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  id?: string; // Add id prop for targeting with scrollIntoView
}

const AccordionField: React.FC<AccordionFieldProps> = ({
  title,
  description,
  children,
  defaultExpanded = false,
  id, // Use the id prop
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div id={id} className="overflow-hidden border rounded-lg">
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-medium text-md">{title}</h3>
          <p className="text-xs text-default-500">{description}</p>
        </div>
        <Button isIconOnly variant="light" size="sm" onPress={toggleOpen}>
          <Icon icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'} />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 border-t border-default-200">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionField;
