import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link2, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import type { URLResponse } from '../types';

export function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortUrl(null);
    setCopied(false);
    
    if (!url) return;
    
    // Auto-prefix http if missing
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.post('/urls/', { original_url: finalUrl });
      setShortUrl((data as URLResponse).short_url);
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="max-w-3xl w-full space-y-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Shorten links. <span className="text-brand-600">Analyze clicks.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          A fast, secure, and professional way to manage your links. Create short URLs instantly, track their performance, and keep them permanently with an account.
        </p>

        <Card className="p-2 sm:p-4 mt-12 bg-white shadow-xl shadow-brand-500/5 max-w-2xl mx-auto border-brand-100">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your long link here"
                className="pl-10 h-12 text-base"
                required
              />
            </div>
            <Button type="submit" isLoading={isLoading} className="h-12 px-8 text-base">
              Shorten
            </Button>
          </form>
          
          {error && <div className="mt-4 text-red-500 text-sm text-left px-2">{error}</div>}
          
          {shortUrl && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium text-brand-900 mb-1">Your shortened link is ready:</p>
                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-medium hover:underline truncate block">
                  {shortUrl}
                </a>
              </div>
              <Button onClick={copyToClipboard} variant={copied ? 'secondary' : 'primary'} className="shrink-0">
                {copied ? <><Check className="w-4 h-4 mr-2" />Copied</> : 'Copy Link'}
              </Button>
            </div>
          )}
        </Card>

        <div className="pt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">1</div>
              Fast Redirects
            </h3>
            <p className="mt-2 text-sm text-slate-600">Redis-powered caching ensures your users get where they're going instantly.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">2</div>
              Permanent URLs
            </h3>
            <p className="mt-2 text-sm text-slate-600">Create a free account to make links permanent and manage them forever.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">3</div>
              Click Analytics
            </h3>
            <p className="mt-2 text-sm text-slate-600">Track clicks, devices, and referrers to see how your links are performing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
