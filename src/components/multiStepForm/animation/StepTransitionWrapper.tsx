import { motion, AnimatePresence } from 'framer-motion';
import { StepNumber } from '../types/stepTypes';

interface StepTransitionWrapperProps {
  currentStep: StepNumber;
  children: React.ReactNode;
}

function StepTransitionWrapper({
  currentStep,
  children,
}: StepTransitionWrapperProps) {
  console.log('🎬 StepTransitionWrapper: 스텝 전환 애니메이션 래퍼 렌더링', {
    currentStep,
    hasChildren: !!children,
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default StepTransitionWrapper;
