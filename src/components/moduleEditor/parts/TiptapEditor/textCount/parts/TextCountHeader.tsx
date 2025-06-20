import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextCountHeaderProps {
  isGoalModeEnabled: boolean;
  includeSpaces: boolean;
  targetChars: number;
  onGoalModeToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIncludeSpacesToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTargetCharsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function GoalModeCheckbox({
  isChecked,
  onChange,
}: {
  isChecked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
        />
        <span>🎯 목표 모드</span>
      </label>
    </div>
  );
}

function GoalSettingsArea({
  includeSpaces,
  targetChars,
  onIncludeSpacesToggle,
  onTargetCharsChange,
}: {
  includeSpaces: boolean;
  targetChars: number;
  onIncludeSpacesToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTargetCharsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="p-3 border-b border-gray-100 bg-blue-50">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-blue-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSpaces}
              onChange={onIncludeSpacesToggle}
              className="w-3 h-3 text-blue-500 rounded focus:ring-blue-500"
            />
            <span>공백포함</span>
          </label>

          <input
            type="number"
            value={targetChars}
            onChange={onTargetCharsChange}
            placeholder="목표글자수"
            className="w-20 px-2 py-1 text-xs text-center border border-blue-300 rounded focus:outline-none focus:border-blue-500"
            min="1"
            max="50000"
          />
        </div>
      </div>
    </motion.div>
  );
}

function TextCountHeader({
  isGoalModeEnabled,
  includeSpaces,
  targetChars,
  onGoalModeToggle,
  onIncludeSpacesToggle,
  onTargetCharsChange,
}: TextCountHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <GoalModeCheckbox
        isChecked={isGoalModeEnabled}
        onChange={onGoalModeToggle}
      />

      <AnimatePresence>
        {isGoalModeEnabled && (
          <GoalSettingsArea
            includeSpaces={includeSpaces}
            targetChars={targetChars}
            onIncludeSpacesToggle={onIncludeSpacesToggle}
            onTargetCharsChange={onTargetCharsChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TextCountHeader;
