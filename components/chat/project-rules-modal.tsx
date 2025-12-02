'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Trash2 } from 'lucide-react';
import { createProjectRule, updateProjectRule, deleteProjectRule, getProjectRules } from '@/lib/actions/project-rules.actions';
import { useProjectRules } from '@/lib/hooks/use-project-rules';
import { toast } from 'sonner';
import type { ProjectRule } from '@/lib/db/schema';

interface ProjectRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: string | undefined;
}

export function ProjectRulesModal({ isOpen, onClose, chainId }: ProjectRulesModalProps) {
  const { rules, loading, setRules, refresh } = useProjectRules(chainId);
  const [editingRules, setEditingRules] = useState<Array<{ id?: string; rule: string; isActive: boolean; order: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Refresh rules when modal opens
  useEffect(() => {
    if (isOpen && chainId) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chainId]);

  useEffect(() => {
    if (isOpen && !loading) {
      if (rules && rules.length > 0) {
        setEditingRules(rules.map(r => ({ id: r.id, rule: r.rule, isActive: r.isActive, order: r.order })));
      } else {
        setEditingRules([]);
      }
    }
  }, [isOpen, rules, loading]);

  const handleAddRule = () => {
    setEditingRules([...editingRules, { rule: '', isActive: true, order: editingRules.length }]);
  };

  const handleUpdateRule = (index: number, field: 'rule' | 'isActive', value: string | boolean) => {
    const updated = [...editingRules];
    updated[index] = { ...updated[index], [field]: value };
    setEditingRules(updated);
  };

  const handleDeleteRule = async (index: number) => {
    const rule = editingRules[index];
    if (rule.id) {
      const result = await deleteProjectRule(rule.id);
      if (result.success) {
        toast.success('Rule deleted');
        setEditingRules(editingRules.filter((_, i) => i !== index));
        // Refresh rules after deletion
        refresh();
      } else {
        toast.error(result.error || 'Failed to delete rule');
      }
    } else {
      setEditingRules(editingRules.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!chainId) return;

    setIsSaving(true);
    try {
      // Filter out empty rules
      const validRules = editingRules.filter(r => r.rule.trim());
      
      for (const rule of validRules) {
        if (rule.id) {
          // Update existing rule
          const formData = new FormData();
          formData.append('id', rule.id);
          formData.append('rule', rule.rule);
          formData.append('isActive', rule.isActive.toString());
          formData.append('order', rule.order.toString());
          
          const result = await updateProjectRule(formData);
          if (!result.success) {
            toast.error(`Failed to update rule: ${result.error}`);
            setIsSaving(false);
            return;
          }
        } else {
          // Create new rule
          const formData = new FormData();
          formData.append('chainId', chainId);
          formData.append('rule', rule.rule);
          formData.append('isActive', rule.isActive.toString());
          formData.append('order', rule.order.toString());
          
          const result = await createProjectRule(formData);
          if (!result.success) {
            toast.error(`Failed to create rule: ${result.error}`);
            setIsSaving(false);
            return;
          }
        }
      }

      // Refresh rules after saving
      refresh();

      toast.success('Project rules saved');
      // Don't close immediately, let user see the updated rules
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      toast.error('Failed to save project rules');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Project Rules</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set rules that will be automatically appended to all prompts in this chain. Rules help maintain consistency across renders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Loading rules...</p>
            </div>
          ) : editingRules.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
              <p>No rules yet. Add your first rule to get started.</p>
            </div>
          ) : (
            editingRules.map((rule, index) => (
              <div key={rule.id || `new-rule-${index}`} className="flex items-start gap-2 p-2 sm:p-3 border rounded-lg">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Input
                      value={rule.rule}
                      onChange={(e) => handleUpdateRule(index, 'rule', e.target.value)}
                      placeholder="e.g., always use xyz material, always make 4 floor high"
                      className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleUpdateRule(index, 'isActive', checked)}
                    />
                    <Label className="text-xs sm:text-sm text-muted-foreground">
                      Automatically attach to all prompts
                    </Label>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button
            variant="outline"
            onClick={handleAddRule}
            className="w-full h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Add Rule
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 sm:pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Rules'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

