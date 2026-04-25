import { chromium, Browser, Page } from "playwright";

export type ScanResult = {
  url: string;
  screenshot: string; // base64
  htmlContent: string;
  metrics: {
    loadTime: number;
    domNodes: number;
    scriptCount: number;
    styleCount: number;
    imageCount: number;
    videoCount: number;
    formCount: number;
    linkCount: number;
  };
  structure: {
    headings: { level: number; text: string }[];
    ctas: { text: string; href?: string; position: { x: number; y: number } }[];
    images: { src: string; alt: string; width: number; height: number }[];
    sections: { type: string; content: string }[];
  };
  design: {
    colors: string[];
    fonts: string[];
    spacing: { padding: string[]; margin: string[] };
    layout: "grid" | "flex" | "float" | "table";
  };
  seo: {
    title: string;
    metaDescription: string;
    h1Count: number;
    imageAltMissing: number;
    canonicalUrl?: string;
  };
  performance: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
  };
  designScore: {
    overall: number;
    conversion: number;
    visual: number;
    mobile: number;
    speed: number;
    accessibility: number;
  };
};

export async function scanWebsiteWithPlaywright(url: string): Promise<ScanResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    const startTime = Date.now();

    // Navigate and wait for network idle
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const loadTime = Date.now() - startTime;

    // Capture full page screenshot
    const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
    const screenshotBase64 = screenshot.toString('base64');

    // Get HTML content
    const htmlContent = await page.content();

    // Extract metrics
    const metrics = await page.evaluate(() => {
      return {
        domNodes: document.querySelectorAll('*').length,
        scriptCount: document.querySelectorAll('script').length,
        styleCount: document.querySelectorAll('style, link[rel="stylesheet"]').length,
        imageCount: document.querySelectorAll('img').length,
        videoCount: document.querySelectorAll('video').length,
        formCount: document.querySelectorAll('form').length,
        linkCount: document.querySelectorAll('a').length,
      };
    });

    // Extract structure
    const structure = await page.evaluate(() => {
      // Headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim() || '',
      }));

      // CTAs (buttons and prominent links)
      const ctas = Array.from(document.querySelectorAll('button, a.btn, a.button, [role="button"]')).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          text: el.textContent?.trim() || '',
          href: (el as HTMLAnchorElement).href,
          position: { x: rect.x, y: rect.y },
        };
      });

      // Images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));

      // Sections
      const sections = Array.from(document.querySelectorAll('section, article, main, header, footer')).map(el => ({
        type: el.tagName.toLowerCase(),
        content: el.textContent?.slice(0, 200).trim() || '',
      }));

      return { headings, ctas, images, sections };
    });

    // Extract design tokens
    const design = await page.evaluate(() => {
      const colors = new Set<string>();
      const fonts = new Set<string>();
      const padding = new Set<string>();
      const margin = new Set<string>();

      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);

        // Colors
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.backgroundColor);
        }
        if (styles.color) {
          colors.add(styles.color);
        }

        // Fonts
        if (styles.fontFamily) {
          fonts.add(styles.fontFamily.split(',')[0].trim());
        }

        // Spacing (sample top elements only for performance)
        if (el.getBoundingClientRect().top < 2000) {
          if (styles.padding && styles.padding !== '0px') padding.add(styles.padding);
          if (styles.margin && styles.margin !== '0px') margin.add(styles.margin);
        }
      });

      // Detect layout type
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      let layout: "grid" | "flex" | "float" | "table" = "float";
      if (bodyStyles.display?.includes('grid')) layout = 'grid';
      else if (bodyStyles.display?.includes('flex')) layout = 'flex';
      else if (bodyStyles.display?.includes('table')) layout = 'table';

      return {
        colors: Array.from(colors).slice(0, 10),
        fonts: Array.from(fonts).slice(0, 5),
        spacing: {
          padding: Array.from(padding).slice(0, 5),
          margin: Array.from(margin).slice(0, 5),
        },
        layout,
      };
    });

    // Extract SEO data
    const seo = await page.evaluate(() => {
      const title = document.title || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1Count = document.querySelectorAll('h1').length;
      const imageAltMissing = Array.from(document.querySelectorAll('img')).filter(img => !img.alt).length;
      const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || undefined;

      return { title, metaDescription, h1Count, imageAltMissing, canonicalUrl };
    });

    // Get Web Vitals
    const performance = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0;

      return {
        fcp: Math.round(fcp),
        lcp: 0, // Would need PerformanceObserver
        cls: 0,
        fid: 0,
      };
    });

    // Calculate design score
    const designScore = calculateDesignScore({
      metrics,
      structure,
      seo,
      performance,
      loadTime,
    });

    return {
      url,
      screenshot: screenshotBase64,
      htmlContent,
      metrics: { ...metrics, loadTime },
      structure,
      design,
      seo,
      performance,
      designScore,
    };

  } catch (error) {
    console.error('Playwright scan failed:', error);
    throw new Error(`Failed to scan ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

function calculateDesignScore(data: {
  metrics: any;
  structure: any;
  seo: any;
  performance: any;
  loadTime: number;
}): ScanResult["designScore"] {
  // Conversion score (0-100)
  let conversion = 100;
  if (data.structure.ctas.length < 3) conversion -= 20; // Too few CTAs
  if (data.seo.h1Count === 0) conversion -= 15; // No H1
  if (data.seo.h1Count > 1) conversion -= 10; // Multiple H1s
  if (data.structure.headings.length < 3) conversion -= 15; // Poor heading structure

  // Visual score (0-100)
  let visual = 100;
  if (data.structure.images.length === 0) visual -= 20; // No images
  if (data.metrics.imageCount > 30) visual -= 15; // Too many images
  const imagesWithoutAlt = data.seo.imageAltMissing;
  if (imagesWithoutAlt > 0) visual -= Math.min(30, imagesWithoutAlt * 3); // Missing alt tags

  // Mobile score (0-100) - simplified
  let mobile = 90; // Assume decent mobile support
  if (data.metrics.domNodes > 1500) mobile -= 20; // Too complex
  if (data.loadTime > 3000) mobile -= 15; // Slow on mobile

  // Speed score (0-100)
  let speed = 100;
  if (data.loadTime > 1000) speed -= 10;
  if (data.loadTime > 2000) speed -= 15;
  if (data.loadTime > 3000) speed -= 20;
  if (data.loadTime > 5000) speed -= 30;
  if (data.performance.fcp > 2000) speed -= 15;

  // Accessibility score (0-100)
  let accessibility = 100;
  if (data.seo.imageAltMissing > 0) accessibility -= Math.min(40, data.seo.imageAltMissing * 5);
  if (data.seo.h1Count === 0) accessibility -= 20;
  if (!data.seo.metaDescription) accessibility -= 10;

  // Overall score
  const overall = Math.round(
    (conversion * 0.3 + visual * 0.2 + mobile * 0.15 + speed * 0.2 + accessibility * 0.15)
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    conversion: Math.max(0, Math.min(100, conversion)),
    visual: Math.max(0, Math.min(100, visual)),
    mobile: Math.max(0, Math.min(100, mobile)),
    speed: Math.max(0, Math.min(100, speed)),
    accessibility: Math.max(0, Math.min(100, accessibility)),
  };
}

// Multi-site competitor analysis
export async function analyzeCompetitors(urls: string[]): Promise<{
  sites: ScanResult[];
  insights: {
    bestPractices: string[];
    commonPatterns: string[];
    uniqueFeatures: string[];
    averageScores: ScanResult["designScore"];
  };
}> {
  const sites = await Promise.all(
    urls.map(url => scanWebsiteWithPlaywright(url).catch(err => {
      console.error(`Failed to scan ${url}:`, err);
      return null;
    }))
  );

  const validSites = sites.filter((s): s is ScanResult => s !== null);

  // Calculate insights
  const insights = {
    bestPractices: extractBestPractices(validSites),
    commonPatterns: extractCommonPatterns(validSites),
    uniqueFeatures: extractUniqueFeatures(validSites),
    averageScores: calculateAverageScores(validSites),
  };

  return { sites: validSites, insights };
}

function extractBestPractices(sites: ScanResult[]): string[] {
  const practices: string[] = [];

  // Find sites with high conversion scores
  const topConverters = sites.filter(s => s.designScore.conversion > 80);
  if (topConverters.length > 0) {
    practices.push(`Use ${Math.round(topConverters.reduce((sum, s) => sum + s.structure.ctas.length, 0) / topConverters.length)} CTAs per page`);
  }

  // Check for consistent patterns
  const sitesWithH1 = sites.filter(s => s.seo.h1Count === 1);
  if (sitesWithH1.length > sites.length * 0.7) {
    practices.push('Always use exactly one H1 heading');
  }

  return practices;
}

function extractCommonPatterns(sites: ScanResult[]): string[] {
  const patterns: string[] = [];

  // Layout patterns
  const layoutCounts = sites.reduce((acc, s) => {
    acc[s.design.layout] = (acc[s.design.layout] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonLayout = Object.entries(layoutCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommonLayout) {
    patterns.push(`${Math.round((mostCommonLayout[1] / sites.length) * 100)}% use ${mostCommonLayout[0]} layout`);
  }

  return patterns;
}

function extractUniqueFeatures(sites: ScanResult[]): string[] {
  const features: string[] = [];

  // Find unique CTAs
  const allCTAs = sites.flatMap(s => s.structure.ctas.map(c => c.text));
  const uniqueCTAs = [...new Set(allCTAs)].filter(cta =>
    allCTAs.filter(c => c === cta).length === 1
  );

  if (uniqueCTAs.length > 0) {
    features.push(`Unique CTAs found: ${uniqueCTAs.slice(0, 3).join(', ')}`);
  }

  return features;
}

function calculateAverageScores(sites: ScanResult[]): ScanResult["designScore"] {
  const sum = sites.reduce(
    (acc, s) => ({
      overall: acc.overall + s.designScore.overall,
      conversion: acc.conversion + s.designScore.conversion,
      visual: acc.visual + s.designScore.visual,
      mobile: acc.mobile + s.designScore.mobile,
      speed: acc.speed + s.designScore.speed,
      accessibility: acc.accessibility + s.designScore.accessibility,
    }),
    { overall: 0, conversion: 0, visual: 0, mobile: 0, speed: 0, accessibility: 0 }
  );

  const count = sites.length;

  return {
    overall: Math.round(sum.overall / count),
    conversion: Math.round(sum.conversion / count),
    visual: Math.round(sum.visual / count),
    mobile: Math.round(sum.mobile / count),
    speed: Math.round(sum.speed / count),
    accessibility: Math.round(sum.accessibility / count),
  };
}
