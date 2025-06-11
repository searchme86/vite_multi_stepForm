interface ProgressBarProps {
  progressWidth: number;
}

function ProgressBar({ progressWidth }: ProgressBarProps) {
  console.log('📊 ProgressBar: 진행률 바 렌더링', { progressWidth });

  return (
    <div className="relative h-1 sm:h-0.5 bg-default-200 rounded-full">
      <div
        className="absolute h-1 sm:h-0.5 bg-primary rounded-full transition-all duration-700 ease-in-out"
        style={{ width: `${progressWidth}%` }}
      />
    </div>
  );
}

export default ProgressBar;
