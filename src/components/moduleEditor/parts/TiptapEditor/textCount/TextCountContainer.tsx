import { motion, AnimatePresence } from 'framer-motion';
import { useTextCountState } from './hooks/useTextCountState';
import { useTextCountCalculation } from './hooks/useTextCountCalculation';
import TextCountHeader from './parts/TextCountHeader';
import TextCountProgress from './parts/TextCountProgress';

interface TextCountContainerProps {
  editorContent: string;
  onRecommendedCharsChange?: (chars: number) => void;
  onGoalModeChange?: (enabled: boolean) => void;
  initialTargetChars?: number;
}

function TextCountContainer({
  editorContent,
  onRecommendedCharsChange,
  onGoalModeChange,
  initialTargetChars = 30,
}: TextCountContainerProps) {
  const {
    targetChars,
    isGoalModeEnabled,
    includeSpaces,
    handleTargetCharsChange,
    handleGoalModeToggle,
    handleIncludeSpacesToggle,
  } = useTextCountState({
    initialTargetChars,
    onRecommendedCharsChange,
    onGoalModeChange,
  });

  const { metrics, ringData } = useTextCountCalculation({
    editorContent,
    targetChars,
    includeSpaces,
  });

  return (
    <div className="bg-white border-b border-gray-200">
      <TextCountHeader
        isGoalModeEnabled={isGoalModeEnabled}
        includeSpaces={includeSpaces}
        targetChars={targetChars}
        onGoalModeToggle={handleGoalModeToggle}
        onIncludeSpacesToggle={handleIncludeSpacesToggle}
        onTargetCharsChange={handleTargetCharsChange}
      />

      <AnimatePresence>
        {isGoalModeEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <TextCountProgress
              rings={ringData}
              metrics={metrics}
              targetChars={targetChars}
              includeSpaces={includeSpaces}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TextCountContainer;
