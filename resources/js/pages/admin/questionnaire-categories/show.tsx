import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Edit, Plus, ClipboardList, Calendar, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import type { BreadcrumbItem, QuestionnaireCategory } from '@/types';
import { useFlashToast } from '@/hooks/useFlashToast';

interface ShowPageProps {
    questionnaireCategory: QuestionnaireCategory & {
        questions_count?: number;
    };
}

type QuestionnaireFormData = Pick<QuestionnaireCategory, 'title' | 'description' | 'is_active'>;

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function Show({ questionnaireCategory, questions = [] }: ShowPageProps) {
    useFlashToast();
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Questionnaires', href: route('admin.questionnaire-categories.index') },
        { title: questionnaireCategory.title, href: '#' },
    ];

    const hasQuestions = questions.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${questionnaireCategory.title} - Questionnaire Category`} />

            <div className="p-4 lg:p-6 max-w-screen-2xl space-y-6">
                <div className="bg-white rounded-lg border shadow-sm p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={route('admin.questionnaire-categories.index')}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl lg:text-xl font-bold text-gray-900 truncate" title={questionnaireCategory.title}>
                                    {questionnaireCategory.title}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-center">
                            <Badge variant={questionnaireCategory.is_active ? 'default' : 'secondary'} className="flex items-center gap-x-1.5">
                                <span className={`h-2 w-2 rounded-full ${questionnaireCategory.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                                {questionnaireCategory.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Manage Category</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setEditModalOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Details</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete (soon)</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
                <div className="grid w-full grid-cols-1 lg:grid-cols-10 gap-6">
                    <Card className="lg:col-span-3 h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                Category Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {questionnaireCategory.description && (
                                <div>
                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</Label>
                                    <p className="mt-1 text-gray-700 break-words">{questionnaireCategory.description}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created On</Label>
                                <div className="mt-1 flex items-center gap-2 text-gray-700">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{formatDate(questionnaireCategory.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-7">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <CardTitle className="flex items-center text-base">
                                    <ClipboardList className="h-4 w-4 mr-2 text-gray-500" />
                                    Questions
                                    <Badge variant="outline" className="ml-2 font-mono text-xs">{questions.length}</Badge>
                                </CardTitle>
                                <Button size="sm" disabled>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {hasQuestions ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-500">
                                        Question rendering will be implemented in the next phase.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ClipboardList className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No questions yet</h3>
                                    <p className="text-sm text-gray-500 mt-2 mb-4 max-w-xs mx-auto">
                                        Get started by adding the first question to this category.
                                    </p>
                                    <Button size="sm" variant="outline" disabled>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Question
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <EditCategoryDialog
                category={questionnaireCategory}
                isOpen={isEditModalOpen}
                onOpenChange={setEditModalOpen}
            />
        </AppLayout>
    );
}
interface EditCategoryDialogProps {
    category: QuestionnaireCategory;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

function EditCategoryDialog({ category, isOpen, onOpenChange }: EditCategoryDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm<QuestionnaireFormData>({
        title: category.title,
        description: category.description || '',
        is_active: category.is_active,
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('admin.questionnaire-categories.update', category.id), {
            onSuccess: () => {
                onOpenChange(false);
            },
            onFinish: () => reset(),
            onError: () => {

            }
        });
    };

    return (
        <FormDialog
            title="Edit Category"
            description={`Update the details for "${category.title}".`}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            onSubmit={handleSubmit}
            isLoading={processing}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={4} />
                    {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>
                <div className="flex items-center space-x-3 pt-2">
                    <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                    <Label htmlFor="is_active" className="cursor-pointer">
                        Mark as Active
                    </Label>
                    {errors.is_active && <p className="text-sm text-red-500">{errors.is_active}</p>}
                </div>
            </div>
        </FormDialog>
    );
}
