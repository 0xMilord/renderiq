'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, NodeProps } from '@xyflow/react';
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
import { Layers, Plus, X } from 'lucide-react';
import { MaterialNodeData } from '@/lib/types/canvas';
import { BaseNode } from './base-node';

export function MaterialNode({ data, id }: NodeProps<{ data: MaterialNodeData }>) {
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

  return (
    <BaseNode
      title="Material Reference"
      icon={Layers}
      nodeType="material"
      nodeId={id}
      className="w-96"
      outputs={[{ id: 'materials', position: Position.Right, type: 'material' }]}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-[#8c8c8c]">Materials</Label>
          <Button
            onClick={addMaterial}
            variant="outline"
            size="sm"
            className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] text-xs nodrag nopan"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {localData.materials.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#8c8c8c]">
              No materials added. Click "Add" to create one.
            </div>
          ) : (
            localData.materials.map((material) => (
              <div
                key={material.id}
                className="p-3 bg-[#1e1e1e] rounded border border-[#3d3d3d] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={material.name}
                    onChange={(e) =>
                      updateMaterial(material.id, { name: e.target.value })
                    }
                    placeholder="Material name"
                    className="bg-[#252526] border-[#3d3d3d] text-white text-xs h-7 flex-1 mr-2 nodrag nopan"
                  />
                  <Button
                    onClick={() => removeMaterial(material.id)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[#8c8c8c] hover:text-white nodrag nopan"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-[#8c8c8c] mb-1 block">Type</Label>
                    <Select
                      value={material.type}
                      onValueChange={(value: any) =>
                        updateMaterial(material.id, { type: value })
                      }
                    >
                      <SelectTrigger className="bg-[#252526] border-[#3d3d3d] text-white h-7 text-xs nodrag nopan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252526] border-[#3d3d3d]">
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
                    <Label className="text-xs text-[#8c8c8c] mb-1 block">Material</Label>
                    <Select
                      value={material.material}
                      onValueChange={(value) =>
                        updateMaterial(material.id, { material: value })
                      }
                    >
                      <SelectTrigger className="bg-[#252526] border-[#3d3d3d] text-white h-7 text-xs nodrag nopan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252526] border-[#3d3d3d]">
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

                {material.finish && (
                  <div>
                    <Label className="text-xs text-[#8c8c8c] mb-1 block">Finish</Label>
                    <Select
                      value={material.finish}
                      onValueChange={(value: any) =>
                        updateMaterial(material.id, { finish: value })
                      }
                    >
                      <SelectTrigger className="bg-[#252526] border-[#3d3d3d] text-white h-7 text-xs nodrag nopan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252526] border-[#3d3d3d]">
                        <SelectItem value="matte">Matte</SelectItem>
                        <SelectItem value="glossy">Glossy</SelectItem>
                        <SelectItem value="semi-gloss">Semi-Gloss</SelectItem>
                        <SelectItem value="rough">Rough</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {material.color && (
                  <div>
                    <Label className="text-xs text-[#8c8c8c] mb-1 block">Color</Label>
                    <Input
                      value={material.color}
                      onChange={(e) =>
                        updateMaterial(material.id, { color: e.target.value })
                      }
                      placeholder="e.g., #FFFFFF or 'white'"
                      className="bg-[#252526] border-[#3d3d3d] text-white text-xs h-7 nodrag nopan"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </BaseNode>
  );
}

