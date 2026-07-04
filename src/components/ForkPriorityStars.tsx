interface Props {
  priority: number;
  onChange?: (p: number) => void;
}

export default function ForkPriorityStars({ priority, onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];

  if (onChange) {
    // 交互模式：可点击调整
    return (
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="优先级">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-lg transition-colors ${
              star <= priority
                ? 'text-amber-400'
                : 'text-gray-200 hover:text-amber-300'
            }`}
            aria-label={`优先级 ${star}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  // 只读模式：纯展示
  return (
    <div className="flex items-center gap-0.5" aria-label={`优先级 ${priority}/5`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= priority ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
