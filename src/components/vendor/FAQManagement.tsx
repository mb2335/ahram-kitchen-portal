
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface FAQ {
  id: string;
  question_en: string;
  answer_en: string;
  question_ko: string;
  answer_ko: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface FAQFormData {
  question_en: string;
  answer_en: string;
  question_ko: string;
  answer_ko: string;
  is_active: boolean;
  display_order: number;
}

export function FAQManagement() {
  const session = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  const form = useForm<FAQFormData>({
    defaultValues: {
      question_en: '',
      answer_en: '',
      question_ko: '',
      answer_ko: '',
      is_active: true,
      display_order: 0,
    },
  });

  // Fetch FAQs
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (faqData: FAQFormData) => {
      const { data, error } = await supabase
        .from('faqs')
        .insert([{
          ...faqData,
          created_by: session?.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({
        title: "Success",
        description: "FAQ created successfully",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create FAQ",
        variant: "destructive",
      });
      console.error('Error creating FAQ:', error);
    },
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async ({ id, ...faqData }: FAQFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('faqs')
        .update(faqData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
      setDialogOpen(false);
      setEditingFAQ(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
      console.error('Error updating FAQ:', error);
    },
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
      console.error('Error deleting FAQ:', error);
    },
  });

  const onSubmit = (data: FAQFormData) => {
    if (editingFAQ) {
      updateFAQMutation.mutate({ ...data, id: editingFAQ.id });
    } else {
      createFAQMutation.mutate(data);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    form.reset({
      question_en: faq.question_en,
      answer_en: faq.answer_en,
      question_ko: faq.question_ko,
      answer_ko: faq.answer_ko,
      is_active: faq.is_active,
      display_order: faq.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      deleteFAQMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingFAQ(null);
    form.reset();
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading FAQs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-muted-foreground">
            Manage frequently asked questions for the Help page
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="english" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="english">English</TabsTrigger>
                    <TabsTrigger value="korean">Korean</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="english" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="question_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question (English)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter question in English" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answer_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer (English)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Enter answer in English"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="korean" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="question_ko"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question (Korean)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="한국어로 질문을 입력하세요" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answer_ko"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer (Korean)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="한국어로 답변을 입력하세요"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFAQMutation.isPending || updateFAQMutation.isPending}
                  >
                    {editingFAQ ? 'Update' : 'Create'} FAQ
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {faqs?.map((faq) => (
          <Card key={faq.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">#{faq.display_order}</span>
                {faq.is_active ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(faq)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(faq.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="english" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="english">English</TabsTrigger>
                <TabsTrigger value="korean">Korean</TabsTrigger>
              </TabsList>
              
              <TabsContent value="english">
                <div className="space-y-2">
                  <h3 className="font-medium">{faq.question_en}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer_en}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="korean">
                <div className="space-y-2">
                  <h3 className="font-medium">{faq.question_ko}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer_ko}</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        ))}
        
        {faqs?.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No FAQs found. Create your first FAQ to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
