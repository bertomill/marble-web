import { useState } from 'react';

interface UseContentGenerationProps {
  onSuccess?: (content: string) => void;
  onError?: (error: Error) => void;
}

export function useContentGeneration({ onSuccess, onError }: UseContentGenerationProps = {}) {
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({});

  const generateContent = async (fieldType: string, projectType?: string) => {
    try {
      setIsGenerating(prev => ({ ...prev, [fieldType]: true }));
      
      const response = await fetch('/api/generate-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldType,
          projectType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.content) {
        onSuccess?.(data.content);
        return data.content;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating content:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
      return null;
    } finally {
      setIsGenerating(prev => ({ ...prev, [fieldType]: false }));
    }
  };

  return {
    isGenerating,
    generateContent,
  };
} 