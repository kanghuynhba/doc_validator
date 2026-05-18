'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StarRatingProps } from '@/lib/types';

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  label,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const displayValue = hoverValue || value;

  const getLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Rate';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => !readOnly && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              onKeyDown={(e) => {
                if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onChange(star);
                }
              }}
              aria-label={`Rate ${star} out of 5 stars - ${getLabel(star)}`}
              disabled={readOnly}
              className={cn(
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded p-0.5',
                readOnly && 'cursor-default',
                !readOnly && 'cursor-pointer hover:scale-110',
                star <= displayValue
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-muted-foreground'
              )}
            >
              <Star className={sizeClasses[size]} />
            </button>
          ))}
        </div>
        {displayValue > 0 && (
          <span className="ml-2 text-sm font-medium text-foreground">
            {displayValue}/{5} - {getLabel(displayValue)}
          </span>
        )}
      </div>
    </div>
  );
}
