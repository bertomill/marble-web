'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

interface CompetitorCardProps {
  competitor: Competitor;
}

const CompetitorCard: React.FC<CompetitorCardProps> = ({ competitor }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{competitor.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-zinc-600">{competitor.description}</p>
        
        {competitor.strengths && competitor.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1 text-green-700">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-medium">Strengths</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {competitor.strengths.map((strength, index) => (
                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1 text-red-700">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs font-medium">Weaknesses</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {competitor.weaknesses.map((weakness, index) => (
                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompetitorCard; 