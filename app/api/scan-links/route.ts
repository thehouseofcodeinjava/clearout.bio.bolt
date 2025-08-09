import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

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

// Helper function to check if URL is valid
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper function to normalize URL
function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      if (baseUrl) {
        const base = new URL(baseUrl);
        return base.origin + url;
      }
      return url;
    }
    if (baseUrl) {
      return new URL(url, baseUrl).href;
    }
    return 'https://' + url;
  } catch {
    return url;
  }
}

// Function to check a single link
async function checkLink(url: string): Promise<LinkResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ClearOut.bio Link Checker 1.0',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const isRedirect = response.url !== url;
    const isWorking = response.status >= 200 && response.status < 400;

    return {
      originalUrl: url,
      finalUrl: response.url || url,
      status: response.status,
      statusText: response.statusText || getStatusText(response.status),
      isWorking,
      isRedirect,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      originalUrl: url,
      finalUrl: url,
      status: 0,
      statusText: error instanceof Error ? error.message : 'Network Error',
      isWorking: false,
      isRedirect: false,
      responseTime,
    };
  }
}

// Helper function to get status text
function getStatusText(status: number): string {
  const statusTexts: { [key: number]: string } = {
    200: 'OK',
    201: 'Created',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  
  return statusTexts[status] || 'Unknown';
}

// Function to extract links from HTML
function extractLinks(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const links: string[] = [];
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const normalizedUrl = normalizeUrl(href, baseUrl);
      if (isValidUrl(normalizedUrl) && !normalizedUrl.startsWith('mailto:') && !normalizedUrl.startsWith('tel:')) {
        // Avoid duplicate links
        if (!links.includes(normalizedUrl)) {
          links.push(normalizedUrl);
        }
      }
    }
  });
  
  return links;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the HTML content of the provided URL
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ClearOut.bio Link Checker 1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const extractedLinks = extractLinks(html, url);

    if (extractedLinks.length === 0) {
      return NextResponse.json({
        totalLinks: 0,
        workingLinks: 0,
        brokenLinks: 0,
        redirects: 0,
        links: [],
      });
    }

    // Check all links concurrently with a reasonable limit
    const maxConcurrent = 10;
    const linkResults: LinkResult[] = [];
    
    for (let i = 0; i < extractedLinks.length; i += maxConcurrent) {
      const batch = extractedLinks.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(link => checkLink(link))
      );
      linkResults.push(...batchResults);
    }

    // Calculate statistics
    const workingLinks = linkResults.filter(link => link.isWorking && !link.isRedirect).length;
    const redirects = linkResults.filter(link => link.isRedirect && link.isWorking).length;
    const brokenLinks = linkResults.filter(link => !link.isWorking).length;

    const result: ScanResult = {
      totalLinks: linkResults.length,
      workingLinks,
      brokenLinks,
      redirects,
      links: linkResults,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error scanning links:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - the URL took too long to respond' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}