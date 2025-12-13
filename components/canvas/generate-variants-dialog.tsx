'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LabeledToggle } from '@/components/tools/ui/labeled-toggle';
import { LabeledSlider } from '@/components/tools/ui/labeled-slider';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GenerateVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: VariantGenerationConfig) => void;
  selectedRenderIds: string[];
}

export interface VariantGenerationConfig {
  variantCount: number;
  variantType: 'consistent' | 'varied';
  viewType?: 'aerial' | 'eye-level' | 'mixed';
  cameraAngles?: boolean; // Use different camera angles
  lightingVariation?: boolean; // Vary lighting
  rotationCoverage?: number; // Rotation coverage in degrees
}

export function GenerateVariantsDialog({
  open,
  onOpenChange,
  onGenerate,
  selectedRenderIds,
}: GenerateVariantsDialogProps) {
  const [variantCount, setVariantCount] = useState<'2' | '4' | '6' | '8'>('4');
  const [variantType, setVariantType] = useState<'consistent' | 'varied'>('consistent');
  const [viewType, setViewType] = useState<'aerial' | 'eye-level' | 'mixed'>('mixed');
  const [cameraAngles, setCameraAngles] = useState(true);
  const [lightingVariation, setLightingVariation] = useState(false);
  const [rotationCoverage, setRotationCoverage] = useState(180);

  const handleGenerate = () => {
    onGenerate({
      variantCount: parseInt(variantCount),
      variantType,
      viewType: variantType === 'varied' ? viewType : undefined,
      cameraAngles: variantType === 'varied' ? cameraAngles : false,
      lightingVariation: variantType === 'varied' ? lightingVariation : false,
      rotationCoverage: variantType === 'varied' ? rotationCoverage : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Variants</DialogTitle>
          <DialogDescription>
            Generate {variantCount} variants of the selected render{selectedRenderIds.length > 1 ? 's' : ''}.
            {variantType === 'consistent' 
              ? ' Variants will maintain consistent style and composition.'
              : ' Variants will include different camera angles and perspectives.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Number of Variants */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="variant-count" className="text-sm">Number of Variants</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select how many variants to generate. Multiple variants will be generated using batch API.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={variantCount} onValueChange={(v: any) => setVariantCount(v)}>
              <SelectTrigger id="variant-count" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Variants</SelectItem>
                <SelectItem value="4">4 Variants</SelectItem>
                <SelectItem value="6">6 Variants</SelectItem>
                <SelectItem value="8">8 Variants</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variant Type */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="variant-type" className="text-sm">Variant Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Consistent: Variants maintain same style and composition. 
                    Varied: Variants include different camera angles and perspectives.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={variantType} onValueChange={(v: any) => setVariantType(v)}>
              <SelectTrigger id="variant-type" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consistent">Consistent Style</SelectItem>
                <SelectItem value="varied">Varied Camera Angles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Varied Options - Only show when variantType is 'varied' */}
          {variantType === 'varied' && (
            <>
              {/* View Type */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="view-type" className="text-sm">View Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the type of camera angles. Aerial: from above. Eye Level: human-scale. Mixed: combination of different perspectives.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
                  <SelectTrigger id="view-type" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aerial">Aerial Views</SelectItem>
                    <SelectItem value="eye-level">Eye Level</SelectItem>
                    <SelectItem value="mixed">Mixed Angles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Angles Toggle */}
              <LabeledToggle
                id="camera-angles"
                label="Different Camera Angles"
                checked={cameraAngles}
                onCheckedChange={setCameraAngles}
                tooltip="Apply different camera angles across variants"
              />

              {/* Lighting Variation */}
              <LabeledToggle
                id="lighting-variation"
                label="Lighting Variation"
                checked={lightingVariation}
                onCheckedChange={setLightingVariation}
                tooltip="Apply different lighting conditions across variants to show various times of day"
              />

              {/* Rotation Coverage */}
              <LabeledSlider
                label="Rotation Coverage"
                value={rotationCoverage}
                onValueChange={(values) => setRotationCoverage(values[0])}
                min={0}
                max={360}
                step={15}
                tooltip="Control the rotation coverage angle in degrees for varied camera positions"
                valueFormatter={(v) => `${v}°`}
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={selectedRenderIds.length === 0}>
            Generate {variantCount} Variants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

