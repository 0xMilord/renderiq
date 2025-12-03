'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Sun, Palette } from 'lucide-react';
import { StyleNodeData } from '@/lib/types/canvas';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function StyleNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<StyleNodeData>(data || {
    camera: {
      focalLength: 35,
      fStop: 5.6,
      position: 'eye-level',
      angle: 'three-quarter',
    },
    environment: {
      scene: 'exterior',
      weather: 'sunny',
      timeOfDay: 'afternoon',
      season: 'summer',
    },
    lighting: {
      intensity: 70,
      direction: 'side',
      color: 'warm',
      shadows: 'soft',
    },
    atmosphere: {
      mood: 'professional',
      contrast: 50,
      saturation: 50,
    },
  });

  // Update local data when prop data changes
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleChange = useCallback((updates: Partial<StyleNodeData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    
    // Dispatch update event
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { nodeId: id, data: newData },
    });
    window.dispatchEvent(event);
  }, [localData, id]);

  const status = (data as any)?.status || NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Style Node"
      icon={Camera}
      nodeType="style"
      nodeId={String(id)}
      className="w-96"
      status={status}
      outputs={[{ id: 'style', position: Position.Right, type: 'style', label: 'Style' }]}
    >
      <div className="space-y-4">
        {/* Camera Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Camera className="h-3 w-3" />
            Camera
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Focal Length: {localData.camera.focalLength}mm
            </Label>
            <Slider
              value={[localData.camera.focalLength]}
              onValueChange={([value]) =>
                handleChange({
                  camera: { ...localData.camera, focalLength: value },
                })
              }
              min={18}
              max={200}
              step={1}
              className="w-full nodrag nopan"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              f-Stop: f/{localData.camera.fStop}
            </Label>
            <Slider
              value={[localData.camera.fStop]}
              onValueChange={([value]) =>
                handleChange({
                  camera: { ...localData.camera, fStop: value },
                })
              }
              min={1.4}
              max={22}
              step={0.1}
              className="w-full nodrag nopan"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Position</Label>
              <Select
                value={localData.camera.position}
                onValueChange={(value: any) =>
                  handleChange({
                    camera: { ...localData.camera, position: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eye-level">Eye Level</SelectItem>
                  <SelectItem value="low-angle">Low Angle</SelectItem>
                  <SelectItem value="high-angle">High Angle</SelectItem>
                  <SelectItem value="bird-eye">Bird's Eye</SelectItem>
                  <SelectItem value="worm-eye">Worm's Eye</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Angle</Label>
              <Select
                value={localData.camera.angle}
                onValueChange={(value: any) =>
                  handleChange({
                    camera: { ...localData.camera, angle: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Front</SelectItem>
                  <SelectItem value="side">Side</SelectItem>
                  <SelectItem value="three-quarter">Three-Quarter</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Environment Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sun className="h-3 w-3" />
            Environment
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Scene</Label>
              <Select
                value={localData.environment.scene}
                onValueChange={(value: any) =>
                  handleChange({
                    environment: { ...localData.environment, scene: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Weather</Label>
              <Select
                value={localData.environment.weather}
                onValueChange={(value: any) =>
                  handleChange({
                    environment: { ...localData.environment, weather: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="foggy">Foggy</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="golden-hour">Golden Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Time of Day</Label>
              <Select
                value={localData.environment.timeOfDay}
                onValueChange={(value: any) =>
                  handleChange({
                    environment: { ...localData.environment, timeOfDay: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dawn">Dawn</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="noon">Noon</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Season</Label>
              <Select
                value={localData.environment.season}
                onValueChange={(value: any) =>
                  handleChange({
                    environment: { ...localData.environment, season: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="autumn">Autumn</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lighting Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sun className="h-3 w-3" />
            Lighting
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Intensity: {localData.lighting.intensity}%
            </Label>
            <Slider
              value={[localData.lighting.intensity]}
              onValueChange={([value]) =>
                handleChange({
                  lighting: { ...localData.lighting, intensity: value },
                })
              }
              min={0}
              max={100}
              step={1}
              className="w-full nodrag nopan"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Direction</Label>
              <Select
                value={localData.lighting.direction}
                onValueChange={(value: any) =>
                  handleChange({
                    lighting: { ...localData.lighting, direction: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Front</SelectItem>
                  <SelectItem value="side">Side</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="rim">Rim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
              <Select
                value={localData.lighting.color}
                onValueChange={(value: any) =>
                  handleChange({
                    lighting: { ...localData.lighting, color: value },
                  })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="golden">Golden</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Shadows</Label>
            <Select
              value={localData.lighting.shadows}
              onValueChange={(value: any) =>
                handleChange({
                  lighting: { ...localData.lighting, shadows: value },
                })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Atmosphere Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Palette className="h-3 w-3" />
            Atmosphere
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Mood</Label>
            <Select
              value={localData.atmosphere.mood}
              onValueChange={(value: any) =>
                handleChange({
                  atmosphere: { ...localData.atmosphere, mood: value },
                })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bright">Bright</SelectItem>
                <SelectItem value="dramatic">Dramatic</SelectItem>
                <SelectItem value="peaceful">Peaceful</SelectItem>
                <SelectItem value="mysterious">Mysterious</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Contrast: {localData.atmosphere.contrast}%
            </Label>
            <Slider
              value={[localData.atmosphere.contrast]}
              onValueChange={([value]) =>
                handleChange({
                  atmosphere: { ...localData.atmosphere, contrast: value },
                })
              }
              min={0}
              max={100}
              step={1}
              className="w-full nodrag nopan"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Saturation: {localData.atmosphere.saturation}%
            </Label>
            <Slider
              value={[localData.atmosphere.saturation]}
              onValueChange={([value]) =>
                handleChange({
                  atmosphere: { ...localData.atmosphere, saturation: value },
                })
              }
              min={0}
              max={100}
              step={1}
              className="w-full nodrag nopan"
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

