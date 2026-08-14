"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { readApiError } from "@/lib/api/client";

type ReviewRow = {
  id: string;
  name: string;
  quote: string;
  rating: number;
  reviewDate: string;
  initials: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  displayOrder: number;
};

type ReviewFormState = {
  name: string;
  quote: string;
  rating: string;
  reviewDate: string;
  initials: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  displayOrder: string;
};

const emptyForm: ReviewFormState = {
  name: "",
  quote: "",
  rating: "5",
  reviewDate: "",
  initials: "",
  status: "pending",
  isFeatured: true,
  displayOrder: "0",
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formFromReview(review: ReviewRow): ReviewFormState {
  return {
    name: review.name,
    quote: review.quote,
    rating: String(review.rating),
    reviewDate: toDatetimeLocal(review.reviewDate),
    initials: review.initials,
    status: review.status,
    isFeatured: review.isFeatured,
    displayOrder: String(review.displayOrder),
  };
}

export function ReviewsAdmin({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const editingReview = useMemo(
    () => reviews.find((review) => review.id === editingId) ?? null,
    [editingId, reviews],
  );

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(review: ReviewRow) {
    setMode("edit");
    setEditingId(review.id);
    setForm(formFromReview(review));
    setError(null);
    setOpen(true);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      quote: form.quote.trim(),
      rating: Number.parseInt(form.rating, 10) || 5,
      reviewDate: new Date(form.reviewDate).toISOString(),
      initials: form.initials.trim(),
      status: form.status,
      isFeatured: form.isFeatured,
      displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
    };

    try {
      const response = await fetch(mode === "create" ? "/api/reviews" : `/api/reviews/${editingId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Could not save review."));
        return;
      }

      const data: unknown = await response.json();
      const review =
        data && typeof data === "object" && "review" in data
          ? (data as { review?: ReviewRow }).review
          : null;

      if (review) {
        setReviews((current) =>
          mode === "create"
            ? [...current, review].sort((a, b) => a.displayOrder - b.displayOrder)
            : current.map((item) => (item.id === review.id ? review : item)),
        );
      } else {
        router.refresh();
      }

      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch {
      setError("Network error while saving review.");
    } finally {
      setPending(false);
    }
  }

  async function patchReview(id: string, patch: Partial<ReviewRow>) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Could not update review."));
        return;
      }
      const data: unknown = await response.json();
      const review =
        data && typeof data === "object" && "review" in data
          ? (data as { review?: ReviewRow }).review
          : null;
      if (review) {
        setReviews((current) => current.map((item) => (item.id === review.id ? review : item)));
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error while updating review.");
    } finally {
      setPending(false);
    }
  }

  async function deleteReview() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        setError(await readApiError(response, "Could not delete review."));
        return;
      }
      setReviews((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setError("Network error while deleting review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-purple-200/70 bg-gradient-to-br from-white via-purple-50/30 to-orange-50/30">
        <CardHeader className="border-b bg-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Reviews</CardTitle>
              <CardDescription>
                Moderate testimonials and control homepage highlights.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-orange-500 text-white">
              New review
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                          {review.initials}
                        </div>
                        <div>
                          <p className="font-medium">{review.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-3 max-w-xl text-sm text-muted-foreground">
                      {review.quote}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Rating: {review.rating}/5
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "success"
                          : review.status === "rejected"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={review.isFeatured ? "default" : "secondary"}>
                        {review.isFeatured ? "Featured" : "Hidden"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{review.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchReview(review.id, { status: "approved" })}
                        disabled={pending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchReview(review.id, { status: "rejected" })}
                        disabled={pending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchReview(review.id, { isFeatured: !review.isFeatured })}
                        disabled={pending}
                      >
                        {review.isFeatured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(review)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(review)}
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
        open={open}
        onOpenChange={setOpen}
        title={mode === "create" ? "Create review" : "Edit review"}
        description={
          mode === "create"
            ? "Add a new customer testimonial."
            : `Editing ${editingReview?.name ?? "review"}`
        }
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="review-form"
              className="bg-gradient-to-r from-purple-600 to-orange-500 text-white"
              disabled={pending}
            >
              {pending ? "Saving..." : "Save review"}
            </Button>
          </div>
        }
      >
        <form id="review-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
          {error ? (
            <p className="md:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="review-name">Name</Label>
            <Input
              id="review-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-initials">Initials</Label>
            <Input
              id="review-initials"
              value={form.initials}
              onChange={(event) => setForm((current) => ({ ...current, initials: event.target.value }))}
              placeholder="TA"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-rating">Rating</Label>
            <Input
              id="review-rating"
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-date">Review date</Label>
            <Input
              id="review-date"
              type="datetime-local"
              value={form.reviewDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, reviewDate: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="review-quote">Quote</Label>
            <Textarea
              id="review-quote"
              rows={6}
              value={form.quote}
              onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-status">Status</Label>
            <Select
              id="review-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ReviewFormState["status"],
                }))
              }
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-order">Display order</Label>
            <Input
              id="review-order"
              type="number"
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({ ...current, displayOrder: event.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isFeatured: event.target.checked }))
                }
                className="h-4 w-4 accent-purple-600"
              />
              <span className="text-sm">Show on homepage</span>
            </label>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Delete review"
        description={
          deleteTarget ? `This will permanently remove ${deleteTarget.name}.` : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteReview} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Deleted reviews disappear from the moderation queue and the public site.
        </p>
      </Dialog>
    </div>
  );
}
