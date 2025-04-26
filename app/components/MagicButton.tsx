import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

interface MagicButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  fieldName: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

const MagicButton: React.FC<MagicButtonProps> = ({
  onClick,
  isGenerating,
  fieldName,
  tooltipPosition = 'top',
  size = 'sm'
}) => {
  const tooltipText = isGenerating 
    ? 'Generating content...' 
    : `Generate ${fieldName} with AI`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={onClick}
            disabled={isGenerating}
            className="px-2 h-8"
          >
            <Sparkles 
              className={`h-4 w-4 ${isGenerating ? 'text-purple-500 animate-pulse' : 'text-gray-400'}`} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipPosition}>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MagicButton; 