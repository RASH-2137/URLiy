import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { URLAnalyticsResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { parseUserAgent } from '../utils/userAgentParser';
import { format } from 'date-fns';
import { ArrowLeft, BarChart2, MousePointerClick, Globe, ExternalLink, Info } from 'lucide-react';

export function Analytics() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [data, setData] = useState<URLAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClickId, setExpandedClickId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get(`/urls/${shortCode}/analytics`);
        setData(response as URLAnalyticsResponse);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (shortCode) {
      fetchAnalytics();
    }
  }, [shortCode]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error || 'Analytics not found'}</p>
        <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/${data.short_code}`;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-brand-600" /> Analytics
        </h1>
      </div>

      <Card className="p-6 bg-white border-brand-100 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Short URL</p>
            <p className="text-lg font-medium text-brand-600">{shortUrl}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Original URL</p>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={data.original_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-brand-600 truncate transition-colors">
                {data.original_url}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Short Code</p>
              <p className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{data.short_code}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">URL ID</p>
              <p className="font-mono text-xs text-slate-500 truncate" title={data.id}>{data.id}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
            <MousePointerClick className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Clicks</p>
            <p className="text-3xl font-bold text-slate-900">{data.clicks.length}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Click History</h2>
        
        {data.clicks.length === 0 ? (
          <Card className="py-12 text-center text-slate-500 border-dashed border-2 shadow-none bg-slate-50/50">
            No clicks recorded yet.
          </Card>
        ) : (
          <Card className="overflow-hidden bg-white shadow-sm border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Device & Browser</th>
                    <th className="px-4 py-3">Referrer</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.clicks.map((click) => {
                    const isExpanded = expandedClickId === click.id;
                    return (
                      <React.Fragment key={click.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-900">
                            {format(new Date(click.clicked_at), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {parseUserAgent(click.user_agent)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {click.referrer ? (
                              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> {click.referrer}</span>
                            ) : (
                              <span className="text-slate-400 italic">Direct / No referrer</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                            {click.ip_address || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpandedClickId(isExpanded ? null : click.id)}>
                              <Info className="w-4 h-4 text-slate-400" />
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50 border-t-0">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="bg-slate-100 rounded p-3 text-xs font-mono text-slate-600 space-y-1 overflow-x-auto">
                                <p><span className="font-semibold text-slate-800">Click ID:</span> {click.id}</p>
                                <p><span className="font-semibold text-slate-800">Raw User Agent:</span> {click.user_agent || 'null'}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
