'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { readApiError } from '@/lib/api/client';

type FaqCategoryRow = {
  id: string;
  title: string;
  displayOrder: number;
  isPublished: boolean;
};

type FaqItemRow = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
};

type CategoryFormState = {
  title: string;
  displayOrder: string;
  isPublished: boolean;
};

type ItemFormState = {
  categoryId: string;
  question: string;
  answer: string;
  displayOrder: string;
  isPublished: boolean;
};

const emptyCategoryForm: CategoryFormState = {
  title: '',
  displayOrder: '0',
  isPublished: true,
};

const emptyItemForm: ItemFormState = {
  categoryId: '',
  question: '<p></p>',
  answer: '<p></p>',
  displayOrder: '0',
  isPublished: true,
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function FaqAdmin({
  initialCategories,
  initialItems,
}: {
  initialCategories: FaqCategoryRow[];
  initialItems: FaqItemRow[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategories[0]?.id ?? ''
  );

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [categoryDeleteTarget, setCategoryDeleteTarget] =
    useState<FaqCategoryRow | null>(null);

  const [itemOpen, setItemOpen] = useState(false);
  const [itemMode, setItemMode] = useState<'create' | 'edit'>('create');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [itemDeleteTarget, setItemDeleteTarget] = useState<FaqItemRow | null>(
    null
  );

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategoryId = selectedCategoryId || (categories[0]?.id ?? '');

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, categories]
  );

  const selectedItems = useMemo(
    () => items.filter((item) => item.categoryId === activeCategoryId),
    [activeCategoryId, items]
  );

  function openCategoryCreate() {
    setCategoryMode('create');
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setError(null);
    setCategoryOpen(true);
  }

  function openItemCreate(categoryId = activeCategoryId) {
    setItemMode('create');
    setEditingItemId(null);
    setItemForm({
      ...emptyItemForm,
      categoryId,
    });
    setError(null);
    setItemOpen(true);
  }

  function openItemEdit(item: FaqItemRow) {
    setItemMode('edit');
    setEditingItemId(item.id);
    setItemForm({
      categoryId: item.categoryId,
      question: item.question,
      answer: item.answer,
      displayOrder: String(item.displayOrder),
      isPublished: item.isPublished,
    });
    setError(null);
    setItemOpen(true);
  }

  async function submitCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      title: categoryForm.title.trim(),
      displayOrder: Number.parseInt(categoryForm.displayOrder, 10) || 0,
      isPublished: categoryForm.isPublished,
    };

    try {
      const response = await fetch(
        categoryMode === 'create'
          ? '/api/faq/categories'
          : `/api/faq/categories/${editingCategoryId}`,
        {
          method: categoryMode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        setError(await readApiError(response, 'Could not save category.'));
        return;
      }

      const data: unknown = await response.json();
      const category =
        data && typeof data === 'object' && 'category' in data
          ? (data as { category?: FaqCategoryRow }).category
          : null;

      if (category) {
        setCategories((current) =>
          categoryMode === 'create'
            ? [...current, category].sort(
                (a, b) => a.displayOrder - b.displayOrder
              )
            : current.map((item) => (item.id === category.id ? category : item))
        );
        if (!activeCategoryId || categoryMode === 'create') {
          setSelectedCategoryId(category.id);
        }
      } else {
        router.refresh();
      }

      setCategoryOpen(false);
    } catch {
      setError('Network error while saving category.');
    } finally {
      setPending(false);
    }
  }

  async function submitItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      categoryId: itemForm.categoryId,
      question: itemForm.question,
      answer: itemForm.answer,
      displayOrder: Number.parseInt(itemForm.displayOrder, 10) || 0,
      isPublished: itemForm.isPublished,
    };

    try {
      const response = await fetch(
        itemMode === 'create'
          ? '/api/faq/items'
          : `/api/faq/items/${editingItemId}`,
        {
          method: itemMode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        setError(await readApiError(response, 'Could not save FAQ item.'));
        return;
      }

      const data: unknown = await response.json();
      const item =
        data && typeof data === 'object' && 'item' in data
          ? (data as { item?: FaqItemRow }).item
          : null;

      if (item) {
        setItems((current) =>
          itemMode === 'create'
            ? [...current, item].sort((a, b) => a.displayOrder - b.displayOrder)
            : current.map((row) => (row.id === item.id ? item : row))
        );
        setSelectedCategoryId(item.categoryId);
      } else {
        router.refresh();
      }

      setItemOpen(false);
    } catch {
      setError('Network error while saving FAQ item.');
    } finally {
      setPending(false);
    }
  }

  async function deleteCategory() {
    if (!categoryDeleteTarget) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/faq/categories/${categoryDeleteTarget.id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok && response.status !== 204) {
        setError(await readApiError(response, 'Could not delete category.'));
        return;
      }
      setCategories((current) =>
        current.filter((category) => category.id !== categoryDeleteTarget.id)
      );
      setItems((current) =>
        current.filter((item) => item.categoryId !== categoryDeleteTarget.id)
      );
      setSelectedCategoryId((current) => {
        if (current !== categoryDeleteTarget.id) return current;
        const remainingCategories = categories.filter(
          (category) => category.id !== categoryDeleteTarget.id
        );
        return remainingCategories[0]?.id ?? '';
      });
      setCategoryDeleteTarget(null);
      router.refresh();
    } catch {
      setError('Network error while deleting category.');
    } finally {
      setPending(false);
    }
  }

  async function deleteItem() {
    if (!itemDeleteTarget) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/faq/items/${itemDeleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        setError(await readApiError(response, 'Could not delete FAQ item.'));
        return;
      }
      setItems((current) =>
        current.filter((item) => item.id !== itemDeleteTarget.id)
      );
      setItemDeleteTarget(null);
      router.refresh();
    } catch {
      setError('Network error while deleting FAQ item.');
    } finally {
      setPending(false);
    }
  }

  async function toggleItemPublished(item: FaqItemRow) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/faq/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not update FAQ item.'));
        return;
      }
      const data: unknown = await response.json();
      const updated =
        data && typeof data === 'object' && 'item' in data
          ? (data as { item?: FaqItemRow }).item
          : null;
      if (updated) {
        setItems((current) =>
          current.map((row) => (row.id === updated.id ? updated : row))
        );
      } else {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? { ...row, isPublished: !item.isPublished }
              : row
          )
        );
      }
      router.refresh();
    } catch {
      setError('Network error while updating FAQ item.');
    } finally {
      setPending(false);
    }
  }

  const categoryCounts = useMemo(() => {
    return new Map(
      categories.map((category) => [
        category.id,
        items.filter((item) => item.categoryId === category.id).length,
      ])
    );
  }, [categories, items]);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="border-purple-200/70 bg-gradient-to-br from-white via-purple-50/30 to-orange-50/20">
        <CardHeader className="border-b bg-white/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">FAQ Categories</CardTitle>
              <CardDescription>
                Organize the public FAQ by topic.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={openCategoryCreate}
              className="bg-gradient-to-r from-purple-600 to-orange-500 text-white"
            >
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {categories.map((category) => {
            const active = category.id === activeCategoryId;
            const itemCount = categoryCounts.get(category.id) ?? 0;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={
                  `w-full rounded-xl border px-4 py-3 text-left transition-colors ` +
                  (active
                    ? 'border-purple-300 bg-purple-50 shadow-sm'
                    : 'hover:bg-muted/60')
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{category.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {itemCount} item{itemCount === 1 ? '' : 's'} · order{' '}
                      {category.displayOrder}
                    </p>
                  </div>
                  <Badge
                    variant={category.isPublished ? 'success' : 'secondary'}
                  >
                    {category.isPublished ? 'Published' : 'Hidden'}
                  </Badge>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-orange-200/70 bg-gradient-to-br from-white via-orange-50/30 to-purple-50/20">
        <CardHeader className="border-b bg-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {selectedCategory?.title ?? 'FAQ Items'}
              </CardTitle>
              <CardDescription>
                Manage the questions and answers for the selected category.
              </CardDescription>
            </div>
            <Button
              onClick={() => openItemCreate()}
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
              disabled={!activeCategoryId}
            >
              New item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-sm">
                    <p className="font-medium text-slate-900">
                      {stripHtml(item.question)}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(item.answer)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isPublished ? 'success' : 'secondary'}>
                      {item.isPublished ? 'Published' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openItemEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleItemPublished(item)}
                        disabled={pending}
                      >
                        {item.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setItemDeleteTarget(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        title={
          categoryMode === 'create'
            ? 'Create FAQ category'
            : 'Edit FAQ category'
        }
        description={
          categoryMode === 'create'
            ? 'Add a new top-level FAQ group.'
            : `Editing ${categories.find((category) => category.id === editingCategoryId)?.title ?? 'category'}`
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="category-form"
              className="bg-gradient-to-r from-purple-600 to-orange-500 text-white"
              disabled={pending}
            >
              {pending ? 'Saving...' : 'Save category'}
            </Button>
          </div>
        }
      >
        <form
          id="category-form"
          className="grid gap-4"
          onSubmit={submitCategory}
        >
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
              value={categoryForm.title}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-order">Display order</Label>
            <Input
              id="category-order"
              type="number"
              value={categoryForm.displayOrder}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
            />
          </div>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <input
              type="checkbox"
              checked={categoryForm.isPublished}
              onChange={(event) =>
                setCategoryForm((current) => ({
                  ...current,
                  isPublished: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-purple-600"
            />
            <span className="text-sm">Published</span>
          </label>
        </form>
      </Dialog>

      <Dialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        title={itemMode === 'create' ? 'Create FAQ item' : 'Edit FAQ item'}
        description={
          itemMode === 'create'
            ? 'Add a question and answer with rich text.'
            : 'Edit the selected FAQ item.'
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="item-form"
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
              disabled={pending}
            >
              {pending ? 'Saving...' : 'Save item'}
            </Button>
          </div>
        }
      >
        <form id="item-form" className="grid gap-4" onSubmit={submitItem}>
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="item-category">Category</Label>
            <Select
              id="item-category"
              value={itemForm.categoryId}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </Select>
          </div>

          <RichTextEditor
            label="Question"
            value={itemForm.question}
            onChange={(value) =>
              setItemForm((current) => ({ ...current, question: value }))
            }
            placeholder="Question content"
          />

          <RichTextEditor
            label="Answer"
            value={itemForm.answer}
            onChange={(value) =>
              setItemForm((current) => ({ ...current, answer: value }))
            }
            placeholder="Answer content"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-order">Display order</Label>
              <Input
                id="item-order"
                type="number"
                value={itemForm.displayOrder}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    displayOrder: event.target.value,
                  }))
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="checkbox"
                checked={itemForm.isPublished}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    isPublished: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-orange-500"
              />
              <span className="text-sm">Published</span>
            </label>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(categoryDeleteTarget)}
        onOpenChange={(value) => !value && setCategoryDeleteTarget(null)}
        title="Delete FAQ category"
        description={
          categoryDeleteTarget
            ? `This will delete ${categoryDeleteTarget.title} and all of its items.`
            : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCategoryDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCategory}
              disabled={pending}
            >
              {pending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Cascading delete is enabled, so all nested FAQ items will be removed
          too.
        </p>
      </Dialog>

      <Dialog
        open={Boolean(itemDeleteTarget)}
        onOpenChange={(value) => !value && setItemDeleteTarget(null)}
        title="Delete FAQ item"
        description={
          itemDeleteTarget
            ? `This will permanently remove the selected item.`
            : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setItemDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteItem}
              disabled={pending}
            >
              {pending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          The public FAQ will stop showing this item once deleted.
        </p>
      </Dialog>
    </div>
  );
}
