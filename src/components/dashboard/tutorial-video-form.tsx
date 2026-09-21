'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type VideoSettings = {
  homepageTitle: string;
  homepageDescription: string;
  keywords: string[];
  ogImage: string | null;
  twitterTitle: string | null;
  canonicalSiteUrl: string | null;
  tutorialVideoUrl: string | null;
};

export function TutorialVideoForm({ initialSettings }: { initialSettings: VideoSettings }) {
  const [url, setUrl] = useState(initialSettings.tutorialVideoUrl ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/seo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...initialSettings, tutorialVideoUrl: url.trim() }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) setError(payload?.error ?? 'Could not save tutorial video.');
    else setMessage('Tutorial video saved successfully.');
    setSaving(false);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>How to Install Video</CardTitle>
        <CardDescription>Set the YouTube tutorial shown on the public website.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="tutorial-video-url">YouTube video URL</Label>
            <Input
              id="tutorial-video-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save video'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
