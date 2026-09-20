'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SeoSettings = {
  homepageTitle: string;
  homepageDescription: string;
  keywords: string[];
  ogImage: string | null;
  twitterTitle: string | null;
  canonicalSiteUrl: string | null;
  tutorialVideoUrl: string | null;
};

export function SeoSettingsForm({
  initialSettings,
}: {
  initialSettings: SeoSettings;
}) {
  const [form, setForm] = useState({
    ...initialSettings,
    keywords: initialSettings.keywords.join(', '),
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/seo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        keywords: form.keywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      setError(payload?.error ?? 'Could not save SEO settings.');
    else setMessage('SEO settings saved successfully.');
    setSaving(false);
  }
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>SEO Settings</CardTitle>
        <CardDescription>
          Manage the public homepage search and social metadata.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
          <Field
            label="Homepage title"
            value={form.homepageTitle}
            onChange={(value) => update('homepageTitle', value)}
          />
          <div className="space-y-2">
            <Label>Homepage description</Label>
            <Textarea
              value={form.homepageDescription}
              onChange={(event) =>
                update('homepageDescription', event.target.value)
              }
              rows={4}
              required
            />
          </div>
          <Field
            label="Keywords (comma separated)"
            value={form.keywords}
            onChange={(value) => update('keywords', value)}
          />
          <Field
            label="Canonical site URL"
            value={form.canonicalSiteUrl ?? ''}
            onChange={(value) => update('canonicalSiteUrl', value)}
          />
          <Field
            label="Open Graph image URL"
            value={form.ogImage ?? ''}
            onChange={(value) => update('ogImage', value)}
          />
          <Field
            label="Twitter title"
            value={form.twitterTitle ?? ''}
            onChange={(value) => update('twitterTitle', value)}
          />
          <Field
            label="How to Install YouTube video URL"
            value={form.tutorialVideoUrl ?? ''}
            onChange={(value) => update('tutorialVideoUrl', value)}
          />
          <p className="-mt-3 text-sm text-muted-foreground">
            Add a YouTube watch URL. The Watch Tutorial button is currently
            locked and will be enabled when the feature is ready.
          </p>
          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save SEO settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}
