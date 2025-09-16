interface TextCountMessageProps {
  progress: number;
}

function TextCountMessage({ progress }: TextCountMessageProps) {
  const getSimpleMessage = (progress: number): string => {
    if (progress >= 100) return '🎉 목표 달성!';
    if (progress >= 75) return '🎯 거의 완료!';
    if (progress >= 50) return '💪 절반 완료!';
    if (progress >= 25) return '🚀 좋은 시작!';
    return '👋 시작해보세요!';
  };

  return (
    <div className="p-2 text-xs text-center text-gray-600">
      {getSimpleMessage(progress)}
    </div>
  );
}

export default TextCountMessage;
