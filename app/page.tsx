'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Download, Loader2, Sparkles, Link as LinkIcon, Globe, Shield } from 'lucide-react';

interface LinkResult {
  originalUrl: string;
  finalUrl: string;
  status: number;
  statusText: string;
  isWorking: boolean;
  isRedirect: boolean;
  responseTime: number;
}

interface ScanResult {
  totalLinks: number;
  workingLinks: number;
  brokenLinks: number;
  redirects: number;
  links: LinkResult[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsScanning(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scan-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan links');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const exportAsHTML = () => {
    if (!result) return;

    const workingLinks = result.links.filter(link => link.isWorking);
    const html = `<!-- Cleaned Links from ClearOut.bio -->
<div class="bio-links">
${workingLinks.map(link => `  <a href="${link.finalUrl}" target="_blank" rel="noopener noreferrer">${link.finalUrl}</a>`).join('\n')}
</div>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned-bio-links.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (link: LinkResult) => {
    if (link.isWorking && !link.isRedirect) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (link.isRedirect) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusLabel = (link: LinkResult) => {
    if (link.isWorking && !link.isRedirect) {
      return <span className="text-green-600 font-medium">✅ Working</span>;
    } else if (link.isRedirect) {
      return <span className="text-yellow-600 font-medium">⚠️ Redirect</span>;
    } else {
      return <span className="text-red-600 font-medium">❌ Broken</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ClearOut.bio
                </h1>
                <p className="text-sm text-gray-600">Clean your bio page links instantly</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>No signup required</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white p-4 rounded-full shadow-lg">
              <LinkIcon className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Clean Your Bio Page
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              In Seconds
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Paste your Linktree, bio page, or any URL. We'll scan all links, check their status, 
            and help you remove broken ones instantly.
          </p>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <label htmlFor="url" className="text-lg font-semibold text-gray-900">
                    Enter your bio page URL
                  </label>
                </div>
                
                <div className="space-y-4">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://linktr.ee/yourname or any bio page URL"
                    className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    disabled={isScanning}
                  />
                  
                  <button
                    onClick={handleScan}
                    disabled={isScanning || !url.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    {isScanning ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Scanning Links...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Clean My Bio Page</span>
                      </div>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Example URLs */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Try with these example URLs:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['https://linktr.ee/example', 'https://bio.link/example'].map((exampleUrl) => (
                <button
                  key={exampleUrl}
                  onClick={() => setUrl(exampleUrl)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors duration-200"
                >
                  {exampleUrl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
          <div className="max-w-6xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 text-center transform hover:scale-105 transition-transform duration-200">
                <div className="text-3xl font-bold text-gray-900 mb-2">{result.totalLinks}</div>
                <div className="text-gray-600 font-medium">Total Links</div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 text-center transform hover:scale-105 transition-transform duration-200">
                <div className="text-3xl font-bold text-green-600 mb-2">{result.workingLinks}</div>
                <div className="text-gray-600 font-medium">Working</div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 text-center transform hover:scale-105 transition-transform duration-200">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{result.redirects}</div>
                <div className="text-gray-600 font-medium">Redirects</div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 text-center transform hover:scale-105 transition-transform duration-200">
                <div className="text-3xl font-bold text-red-600 mb-2">{result.brokenLinks}</div>
                <div className="text-gray-600 font-medium">Broken</div>
              </div>
            </div>

            {/* Results Message */}
            <div className="text-center mb-8">
              {result.brokenLinks === 0 ? (
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-6 py-3 rounded-xl border border-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">🎉 No broken links found! Your bio page is clean.</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-yellow-50 text-yellow-800 px-6 py-3 rounded-xl border border-yellow-200">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Found {result.brokenLinks} issue{result.brokenLinks !== 1 ? 's' : ''} that need attention</span>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="text-center mb-8">
              <button
                onClick={exportAsHTML}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Export Clean Links</span>
              </button>
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Link Analysis Results</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Original URL</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Final URL</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">HTTP Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.links.map((link, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(link)}
                            {getStatusLabel(link)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate max-w-xs" title={link.originalUrl}>
                              {link.originalUrl}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 truncate max-w-xs block" title={link.finalUrl}>
                            {link.finalUrl}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            link.status >= 200 && link.status < 300
                              ? 'bg-green-100 text-green-800'
                              : link.status >= 300 && link.status < 400
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {link.status} {link.statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {link.responseTime}ms
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ClearOut.bio</span>
              </div>
              <p className="text-gray-400">
                The fastest way to clean and optimize your bio page links.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>• Instant link scanning</li>
                <li>• Broken link detection</li>
                <li>• Export clean links</li>
                <li>• No signup required</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Privacy</h4>
              <p className="text-gray-400 text-sm">
                We don't store your data. All link checking happens in real-time 
                and results are not saved on our servers.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ClearOut.bio. Built with Next.js and Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}