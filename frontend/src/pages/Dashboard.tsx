import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { URLResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link2, Trash2, Copy, BarChart2, Plus, ExternalLink, Check, MousePointerClick } from 'lucide-react';


export function Dashboard() {
  const [urls, setUrls] = useState<URLResponse[]>([]);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [createError, setCreateError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUrls = async () => {
    try {
      const data = await apiClient.get('/urls/my');
      const fetchedUrls = data as URLResponse[];
      setUrls(fetchedUrls);
      
      const counts: Record<string, number> = {};
      await Promise.all(fetchedUrls.map(async (u) => {
        try {
          const analytics: any = await apiClient.get(`/urls/${u.short_code}/analytics`);
          counts[u.short_code] = analytics.clicks.length;
        } catch (err) {
          counts[u.short_code] = 0;
        }
      }));
      setClickCounts(counts);

    } catch (error) {
      console.error('Failed to fetch URLs', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isCreating) return;
    setCreateError('');
    
    let finalUrl = newUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    setIsCreating(true);
    try {
      await apiClient.post('/urls/permanent', { original_url: finalUrl });
      setNewUrl('');
      await fetchUrls();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create URL');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (shortCode: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    try {
      await apiClient.delete(`/urls/${shortCode}`);
      setUrls(urls.filter(u => u.short_code !== shortCode));
    } catch (err: any) {
      alert(err.message || 'Failed to delete URL');
    }
  };

  const handleCopy = (id: string, shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Manage your shortened URLs.</p>
          <p className="text-slate-500 text-xs mt-0.5">Create, manage, and understand how your links perform.</p>
        </div>
      </div>

      <Card className="p-4 sm:p-6 bg-white">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="Paste a URL to create a permanent link"
              className="pl-10"
              disabled={isCreating}
              required
            />
          </div>
          <Button type="submit" isLoading={isCreating} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Permanent Link
          </Button>
        </form>
        {createError && <p className="text-red-500 text-sm mt-2">{createError}</p>}
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : urls.length === 0 ? (
        <Card className="py-20 px-4 text-center border-dashed border-2 shadow-sm bg-slate-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-5">
            <Link2 className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No permanent links yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Create your first permanent short link above to start tracking clicks and sharing easily.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {urls.map((url) => (
            <Card key={url.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5 sm:items-center justify-between group bg-white hover:border-brand-200 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline flex items-center text-lg">
                    {url.short_url}
                  </a>
                  <Button variant="ghost" className="h-8 px-2" onClick={() => handleCopy(url.id, url.short_url)}>
                    {copiedId === url.id ? (
                      <span className="flex items-center text-green-600 text-xs font-medium">
                        <Check className="w-4 h-4 mr-1" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </Button>
                </div>
                <div className="text-sm text-slate-500 truncate flex items-center gap-1.5 mb-1">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <a href={url.original_url} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 truncate transition-colors" title={url.original_url}>
                    {url.original_url}
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 pt-4 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0">
                
                <div className="flex flex-col items-start sm:items-end min-w-[4.5rem]">
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5" title="Total Clicks">
                    <MousePointerClick className="w-4 h-4 text-slate-400" />
                    {clickCounts[url.short_code] !== undefined ? clickCounts[url.short_code] : <span className="w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {url.expires_at ? 'Temporary' : 'Permanent'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/dashboard/analytics/${url.short_code}`}>
                    <Button variant="secondary" className="h-9 px-3">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => handleDelete(url.short_code)} className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
