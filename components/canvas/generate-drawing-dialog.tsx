'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { HelpCircle, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/lib/utils/logger';

export interface DrawingGenerationConfig {
  // Floor plans
  selectedFloorPlans: Set<'normal-floor-plan' | 'reflected-ceiling-plan'>;
  // Elevations
  selectedElevationSides: Set<'front' | 'back' | 'left' | 'right'>;
  // Sections
  selectedSectionCuts: Set<'latitudinal' | 'longitudinal'>;
  // Options
  includeText: boolean;
  style: 'technical' | 'minimal' | 'detailed';
}

interface GenerateDrawingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRenderIds: string[];
  onGenerate: (config: DrawingGenerationConfig, selectedRenderIds: string[]) => void;
}

export function GenerateDrawingDialog({
  open,
  onOpenChange,
  selectedRenderIds,
  onGenerate,
}: GenerateDrawingDialogProps) {
  const [selectedFloorPlans, setSelectedFloorPlans] = useState<Set<'normal-floor-plan' | 'reflected-ceiling-plan'>>(new Set(['normal-floor-plan']));
  const [selectedElevationSides, setSelectedElevationSides] = useState<Set<'front' | 'back' | 'left' | 'right'>>(new Set(['front']));
  const [selectedSectionCuts, setSelectedSectionCuts] = useState<Set<'latitudinal' | 'longitudinal'>>(new Set(['longitudinal']));
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [style, setStyle] = useState<'technical' | 'minimal' | 'detailed'>('technical');

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSelectedFloorPlans(new Set(['normal-floor-plan']));
      setSelectedElevationSides(new Set(['front']));
      setSelectedSectionCuts(new Set(['longitudinal']));
      setIncludeText(true);
      setStyle('technical');
    }
    }, [open]);

  const handleGenerate = () => {
    if (selectedRenderIds.length === 0) {
      logger.warn('GenerateDrawingDialog: No renders selected for drawing generation.');
      return;
    }

    const totalDrawings = selectedFloorPlans.size + selectedElevationSides.size + selectedSectionCuts.size;
    if (totalDrawings === 0) {
      logger.warn('GenerateDrawingDialog: No drawing types selected.');
      return;
    }

    const config: DrawingGenerationConfig = {
      selectedFloorPlans,
      selectedElevationSides,
      selectedSectionCuts,
      includeText,
      style,
    };

    logger.log('GenerateDrawingDialog: Initiating drawing generation', { config, selectedRenderIds });
    onGenerate(config, selectedRenderIds);
    onOpenChange(false); // Close dialog after initiating generation
  };

  const totalDrawings = selectedFloorPlans.size + selectedElevationSides.size + selectedSectionCuts.size;
  const isGenerateDisabled = selectedRenderIds.length === 0 || totalDrawings === 0;

  const toggleFloorPlan = (type: 'normal-floor-plan' | 'reflected-ceiling-plan') => {
    const newSet = new Set(selectedFloorPlans);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedFloorPlans(newSet);
  };

  const toggleElevationSide = (side: 'front' | 'back' | 'left' | 'right') => {
    const newSet = new Set(selectedElevationSides);
    if (newSet.has(side)) {
      newSet.delete(side);
    } else {
      newSet.add(side);
    }
    setSelectedElevationSides(newSet);
  };

  const toggleSectionCut = (cut: 'latitudinal' | 'longitudinal') => {
    const newSet = new Set(selectedSectionCuts);
    if (newSet.has(cut)) {
      newSet.delete(cut);
    } else {
      newSet.add(cut);
    }
    setSelectedSectionCuts(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Drawing
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Selected Renders</Label>
            <span className="text-sm text-muted-foreground">
              {selectedRenderIds.length} image{selectedRenderIds.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Floor Plans */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-semibold">Floor Plans</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select floor plan types to generate from the selected image(s).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="normal-floor-plan"
                  checked={selectedFloorPlans.has('normal-floor-plan')}
                  onCheckedChange={() => toggleFloorPlan('normal-floor-plan')}
                />
                <Label htmlFor="normal-floor-plan" className="text-sm cursor-pointer">Normal Floor Plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reflected-ceiling-plan"
                  checked={selectedFloorPlans.has('reflected-ceiling-plan')}
                  onCheckedChange={() => toggleFloorPlan('reflected-ceiling-plan')}
                />
                <Label htmlFor="reflected-ceiling-plan" className="text-sm cursor-pointer">Reflected Ceiling Plan</Label>
              </div>
            </div>
          </div>

          {/* Elevations */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-semibold">Elevations</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select elevation sides to generate from the selected image(s).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-3">
              {(['front', 'back', 'left', 'right'] as const).map((side) => (
                <div key={side} className="flex items-center space-x-2">
                  <Checkbox
                    id={`elevation-${side}`}
                    checked={selectedElevationSides.has(side)}
                    onCheckedChange={() => toggleElevationSide(side)}
                  />
                  <Label htmlFor={`elevation-${side}`} className="text-sm cursor-pointer capitalize">{side}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-semibold">Sections</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select section cut directions to generate from the selected image(s).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="latitudinal"
                  checked={selectedSectionCuts.has('latitudinal')}
                  onCheckedChange={() => toggleSectionCut('latitudinal')}
                />
                <Label htmlFor="latitudinal" className="text-sm cursor-pointer">Latitudinal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="longitudinal"
                  checked={selectedSectionCuts.has('longitudinal')}
                  onCheckedChange={() => toggleSectionCut('longitudinal')}
                />
                <Label htmlFor="longitudinal" className="text-sm cursor-pointer">Longitudinal</Label>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="include-text" className="text-sm">Include Text</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Include text labels, dimensions, and annotations in the drawings. Turn off for graphical symbols only.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                id="include-text"
                checked={includeText}
                onCheckedChange={setIncludeText}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="style" className="text-sm">Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the visual style for the CAD drawings. Technical: standard CAD conventions. Minimal: simplified linework. Detailed: comprehensive with annotations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                <SelectTrigger id="style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Drawings:</span>
              <span className="font-semibold">{totalDrawings}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isGenerateDisabled}>
            <FileText className="h-4 w-4 mr-1" />
            Generate {totalDrawings} Drawing{totalDrawings !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

