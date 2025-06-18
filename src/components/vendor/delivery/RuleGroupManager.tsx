import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Save, Edit, Copy, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeliveryRule, RuleGroup } from '@/hooks/vendor/useEnhancedDeliveryRules';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RuleGroupManagerProps {
  ruleGroups: RuleGroup[];
  categories: Array<{ id: string; name: string }>;
  onSaveRuleGroup: (ruleGroup: RuleGroup) => void;
  onDeleteRuleGroup: (groupId: string) => void;
  onToggleRuleGroup: (groupId: string, active: boolean) => void;
}

export function RuleGroupManager({
  ruleGroups,
  categories,
  onSaveRuleGroup,
  onDeleteRuleGroup,
  onToggleRuleGroup,
}: RuleGroupManagerProps) {
  const [editingGroup, setEditingGroup] = useState<RuleGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const activeRuleGroups = ruleGroups.filter(group => group.is_active);
  const hasActiveGroup = activeRuleGroups.length > 0;

  const startNewGroup = () => {
    setEditingGroup({
      id: `temp-${Date.now()}`,
      name: newGroupName || 'New Rule Group',
      rules: [{ 
        category_id: '', 
        minimum_items: 1, 
        logical_operator: 'OR',
        vendor_id: '',
        rule_group_id: '',
        rule_group_name: '',
        is_active: true
      }],
      is_active: true,
    });
    setNewGroupName('');
  };

  const editExistingGroup = (group: RuleGroup) => {
    setEditingGroup({ ...group });
  };

  const duplicateGroup = (group: RuleGroup) => {
    setEditingGroup({
      ...group,
      id: `temp-${Date.now()}`,
      name: `${group.name} (Copy)`,
    });
  };

  const addRuleToGroup = () => {
    if (!editingGroup) return;
    setEditingGroup({
      ...editingGroup,
      rules: [...editingGroup.rules, { 
        category_id: '', 
        minimum_items: 1, 
        logical_operator: 'OR',
        vendor_id: '',
        rule_group_id: '',
        rule_group_name: '',
        is_active: true
      }],
    });
  };

  const updateRule = (ruleIndex: number, field: keyof DeliveryRule, value: any) => {
    if (!editingGroup) return;
    const updatedRules = [...editingGroup.rules];
    updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], [field]: value };
    setEditingGroup({ ...editingGroup, rules: updatedRules });
  };

  const removeRule = (ruleIndex: number) => {
    if (!editingGroup || editingGroup.rules.length <= 1) return;
    const updatedRules = editingGroup.rules.filter((_, index) => index !== ruleIndex);
    setEditingGroup({ ...editingGroup, rules: updatedRules });
  };

  const saveGroup = () => {
    if (!editingGroup || editingGroup.rules.some(rule => !rule.category_id)) return;
    onSaveRuleGroup(editingGroup);
    setEditingGroup(null);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
  };

  const confirmDelete = (groupId: string) => {
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (groupToDelete) {
      onDeleteRuleGroup(groupToDelete);
      setGroupToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown Category';
  };

  const getAvailableCategories = (currentCategoryId?: string) => {
    if (!editingGroup) return categories;
    const usedCategories = editingGroup.rules
      .map(rule => rule.category_id)
      .filter(id => id && id !== currentCategoryId);
    return categories.filter(cat => !usedCategories.includes(cat.id));
  };

  // Format rule group display to show the categories with OR logic
  const formatRuleGroupDisplay = (group: RuleGroup) => {
    if (group.rules.length === 0) return 'No rules configured';
    
    return group.rules.map((rule, index) => {
      const categoryName = getCategoryName(rule.category_id);
      const ruleText = `${rule.minimum_items}+ ${categoryName}`;
      
      if (index === 0) {
        return ruleText;
      } else {
        return ` OR ${ruleText}`;
      }
    }).join('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Rule Groups</CardTitle>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create rule groups with OR logic to define when delivery is available.
              Customers need to meet at least one category requirement in the active rule group.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Add multiple categories to a rule group. 
                Delivery will be enabled if the customer has enough items from ANY of the categories.
                Only one rule group can be active at a time.
                {hasActiveGroup && (
                  <span className="block mt-1 text-sm font-medium">
                    Currently active: {activeRuleGroups[0].name}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Group Creation */}
          {!editingGroup && (
            <div className="flex gap-3 items-end p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <Label htmlFor="group-name">Rule Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Large Order Rules"
                />
              </div>
              <Button onClick={startNewGroup}>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          )}

          {/* Rule Group Editor */}
          {editingGroup && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Input
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    className="text-lg font-semibold border-none p-0 h-auto"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                    <Button onClick={saveGroup} disabled={editingGroup.rules.some(rule => !rule.category_id)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Group
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingGroup.rules.map((rule, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && (
                      <div className="flex items-center justify-center">
                        <Badge variant="secondary" className="px-3 py-1">
                          OR
                        </Badge>
                      </div>
                    )}
                    <div className="flex gap-3 items-end p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label>Category</Label>
                        <Select
                          value={rule.category_id}
                          onValueChange={(value) => updateRule(index, 'category_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableCategories(rule.category_id).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label>Min Items</Label>
                        <Input
                          type="number"
                          min="1"
                          value={rule.minimum_items}
                          onChange={(e) => updateRule(index, 'minimum_items', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      {editingGroup.rules.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRule(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addRuleToGroup} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Rule Groups */}
          <div className="space-y-3">
            {ruleGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium">{group.name}</div>
                    <Badge variant={group.is_active ? "default" : "secondary"}>
                      {group.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {group.is_active && (
                      <Badge variant="outline" className="text-xs">
                        Current Rule Set
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Rules:</span> {formatRuleGroupDisplay(group)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {group.rules.length} categor{group.rules.length !== 1 ? 'ies' : 'y'} in this group
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Active:</Label>
                    <Switch
                      checked={group.is_active}
                      onCheckedChange={(checked) => onToggleRuleGroup(group.id, checked)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateGroup(group)}
                    title="Duplicate group"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editExistingGroup(group)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDelete(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {ruleGroups.length === 0 && !editingGroup && (
              <div className="text-center py-8 text-muted-foreground">
                No delivery rule groups configured. Create a group above to enable conditional delivery.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule group? All rules within this group will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGroupToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
