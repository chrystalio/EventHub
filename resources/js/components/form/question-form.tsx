    import React, { useState, useEffect } from 'react';
    import { useForm } from '@inertiajs/react';
    import { FormDialog } from '@/components/ui/form-dialog';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Input } from '@/components/ui/input';
    import type { QuestionnaireCategory, Question } from '@/types';

    interface QuestionFormModalProps {
        category: QuestionnaireCategory;
        question?: Question;
        isOpen: boolean;
        onOpenChange: (open: boolean) => void;
    }

    const questionTypes = [
        { value: 'open', label: 'Open Text' },
        { value: 'likert', label: 'Likert Scale (1-5)' },
    ];

    type QuestionFormData = {
        label: string;
        type: string;
        options: string[];
    } & Record<string, any>;

    export function QuestionFormModal({ category, question, isOpen, onOpenChange }: QuestionFormModalProps) {
        const [options, setOptions] = useState<string[]>([]);
        const isEditMode = !!question;

        const { data, setData, post, put, processing, errors, reset } = useForm<QuestionFormData>({
            label: '',
            type: 'open',
            options: [],
        });

        useEffect(() => {
            if (isEditMode && question) {
                setData({
                    label: question.label,
                    type: question.type,
                    options: question.options || [],
                });
                setOptions(question.options || []);
            } else {
                reset();
                setOptions([]);
            }
        }, [question, isOpen]);

        useEffect(() => {
            if (data.type === 'likert' && options.length === 0) {
                const defaultLikert = [
                    '1 - Strongly Disagree',
                    '2 - Disagree',
                    '3 - Neutral',
                    '4 - Agree',
                    '5 - Strongly Agree'
                ];
                setOptions(defaultLikert);
                setData('options', defaultLikert);
            } else if (data.type === 'open') {
                setOptions([]);
                setData('options', []);
            }
        }, [data.type]);

        const needsOptions = data.type === 'likert';

        const updateOption = (index: number, value: string) => {
            const newOptions = [...options];
            newOptions[index] = value;
            setOptions(newOptions);
            setData('options', newOptions);
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            const submitData = {
                ...data,
                options: needsOptions ? options.filter(opt => opt.trim() !== '') : [],
            };

            if (isEditMode) {
                put(route('admin.questionnaire-categories.questions.update', [category.id, question.id]), {
                    data: submitData,
                    onSuccess: () => {
                        onOpenChange(false);
                        reset();
                        setOptions([]);
                    },
                });
            } else {
                post(route('admin.questionnaire-categories.questions.store', { questionnaireCategory: category.id }), {
                    data: submitData,
                    onSuccess: () => {
                        onOpenChange(false);
                        reset();
                        setOptions([]);
                    },
                    onError: (errors) => {
                        console.error('Error creating question:', errors);
                    }
                });
            }
        };

        return (
            <FormDialog
                title={isEditMode ? 'Edit Question' : 'Add New Question'}
                description={`${isEditMode ? 'Update' : 'Create'} a question for "${category.title}"`}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onSubmit={handleSubmit}
                isLoading={processing}
                className="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="label">Question Text</Label>
                        <Textarea
                            id="label"
                            value={data.label}
                            onChange={(e) => setData('label', e.target.value)}
                            placeholder="Enter your question here..."
                            rows={3}
                            required
                        />
                        {errors.label && <p className="text-sm text-red-500">{errors.label}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Question Type</Label>
                        <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                                {questionTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                    </div>
                    {needsOptions && (
                        <div className="space-y-2">
                            <Label>Likert Scale Labels</Label>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                                        <Input
                                            value={option}
                                            onChange={(e) => updateOption(index, e.target.value)}
                                            placeholder={`Scale point ${index + 1}`}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-300 italic">
                                Customize the labels for your 5-point Likert scale.
                            </p>
                        </div>
                    )}
                </div>
            </FormDialog>
        );
    }
