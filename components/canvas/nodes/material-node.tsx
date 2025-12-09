'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Layers, Plus, X, ChevronDown } from 'lucide-react';
import { MaterialNodeData } from '@/lib/types/canvas';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function MaterialNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<MaterialNodeData>(data || {
    materials: [],
  });

  // Update local data when prop data changes
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleChange = useCallback((updates: MaterialNodeData) => {
    setLocalData(updates);
    
    // Dispatch update event
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { nodeId: id, data: updates },
    });
    window.dispatchEvent(event);
  }, [id]);

  const addMaterial = useCallback(() => {
    const newMaterial = {
      id: `mat-${Date.now()}`,
      name: 'New Material',
      type: 'wall' as const,
      material: 'concrete',
    };
    handleChange({
      materials: [...localData.materials, newMaterial],
    });
  }, [localData.materials, handleChange]);

  const removeMaterial = useCallback((materialId: string) => {
    handleChange({
      materials: localData.materials.filter((m) => m.id !== materialId),
    });
  }, [localData.materials, handleChange]);

  const updateMaterial = useCallback((materialId: string, updates: Partial<MaterialNodeData['materials'][0]>) => {
    handleChange({
      materials: localData.materials.map((m) =>
        m.id === materialId ? { ...m, ...updates } : m
      ),
    });
  }, [localData.materials, handleChange]);

  const status = (data as any)?.status || NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Material Reference"
      icon={Layers}
      nodeType="material"
      nodeId={String(id)}
      className="w-80"
      status={status}
      outputs={[{ id: 'materials', position: Position.Right, type: 'material', label: 'Materials' }]}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Materials ({localData.materials.length})
          </Label>
          <Button
            onClick={addMaterial}
            variant="outline"
            size="sm"
            className="h-7 text-xs nodrag nopan"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {localData.materials.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded">
            No materials added. Click "Add" to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <Accordion type="multiple" className="w-full">
              {localData.materials.map((material, index) => (
                <AccordionItem 
                  key={material.id} 
                  value={material.id}
                  className="border border-border rounded mb-2 last:mb-0"
                >
                  <AccordionTrigger className="px-3 py-2 hover:no-underline text-xs">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-medium truncate">{material.name || `Material ${index + 1}`}</span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMaterial(material.id);
                        }}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive nodrag nopan flex items-center justify-center rounded-sm hover:bg-accent cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            removeMaterial(material.id);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
                      <Input
                        value={material.name}
                        onChange={(e) =>
                          updateMaterial(material.id, { name: e.target.value })
                        }
                        placeholder="Material name"
                        className="bg-background border-border text-foreground text-xs h-7 nodrag nopan"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                        <Select
                          value={material.type}
                          onValueChange={(value: any) =>
                            updateMaterial(material.id, { type: value })
                          }
                        >
                          <SelectTrigger 
                            className="bg-background border-border text-foreground h-7 text-xs nodrag nopan"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wall">Wall</SelectItem>
                            <SelectItem value="floor">Floor</SelectItem>
                            <SelectItem value="ceiling">Ceiling</SelectItem>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="exterior">Exterior</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Material</Label>
                        <Select
                          value={material.material}
                          onValueChange={(value) =>
                            updateMaterial(material.id, { material: value })
                          }
                        >
                          <SelectTrigger 
                            className="bg-background border-border text-foreground h-7 text-xs nodrag nopan"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="concrete">Concrete</SelectItem>
                            <SelectItem value="wood">Wood</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="metal">Metal</SelectItem>
                            <SelectItem value="brick">Brick</SelectItem>
                            <SelectItem value="stone">Stone</SelectItem>
                            <SelectItem value="plaster">Plaster</SelectItem>
                            <SelectItem value="paint">Paint</SelectItem>
                            <SelectItem value="fabric">Fabric</SelectItem>
                            <SelectItem value="leather">Leather</SelectItem>
                            <SelectItem value="marble">Marble</SelectItem>
                            <SelectItem value="tile">Tile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Finish</Label>
                        <Select
                          value={material.finish || 'matte'}
                          onValueChange={(value: any) =>
                            updateMaterial(material.id, { finish: value })
                          }
                        >
                          <SelectTrigger 
                            className="bg-background border-border text-foreground h-7 text-xs nodrag nopan"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="matte">Matte</SelectItem>
                            <SelectItem value="glossy">Glossy</SelectItem>
                            <SelectItem value="semi-gloss">Semi-Gloss</SelectItem>
                            <SelectItem value="rough">Rough</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
                        <Input
                          value={material.color || ''}
                          onChange={(e) =>
                            updateMaterial(material.id, { color: e.target.value })
                          }
                          placeholder="#FFFFFF"
                          className="bg-background border-border text-foreground text-xs h-7 nodrag nopan"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
