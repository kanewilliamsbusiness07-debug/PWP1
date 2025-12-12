/**
 * Chart to Image Conversion Utilities
 * Converts HTML elements (charts) to high-resolution PNG images for PDF embedding
 */

import html2canvas from 'html2canvas';

export interface ChartImageOptions {
  width?: number;
  height?: number;
  scale?: number;
  quality?: number;
  backgroundColor?: string;
}

/**
 * Convert a single chart HTML element to a high-resolution base64 PNG image
 * Uses html2canvas for rendering
 */
export async function convertChartToImage(
  chartElement: HTMLElement | null,
  options: ChartImageOptions = {}
): Promise<string | undefined> {
  if (!chartElement) {
    console.warn('Chart element is null, cannot convert to image');
    return undefined;
  }

  const {
    width = 1000,
    height = 600,
    scale = 2, // 2x resolution for sharp images
    quality = 0.95,
    backgroundColor = '#ffffff',
  } = options;

  try {
    // Use html2canvas to render the element
    const canvas = await html2canvas(chartElement, {
      scale: scale,
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      // Improve rendering quality
      imageTimeout: 0,
      removeContainer: true,
    });

    // Convert to base64 PNG
    const dataUrl = canvas.toDataURL('image/png', quality);
    
    // Validate the result
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.warn('Generated image data URL is invalid');
      return undefined;
    }

    if (dataUrl.length < 100) {
      console.warn('Generated image is too small, possibly empty');
      return undefined;
    }

    return dataUrl;
  } catch (error) {
    console.error('Error converting chart to image:', error);
    return undefined;
  }
}

/**
 * Convert multiple chart elements to images at once
 * Returns an object mapping chart keys to their base64 image data URLs
 */
export async function convertAllCharts(
  chartRefs: Record<string, HTMLElement | null>,
  options: ChartImageOptions = {}
): Promise<Record<string, string | undefined>> {
  const images: Record<string, string | undefined> = {};

  const entries = Object.entries(chartRefs);
  
  // Process charts sequentially to avoid memory issues
  for (const [key, element] of entries) {
    if (element) {
      try {
        images[key] = await convertChartToImage(element, options);
      } catch (error) {
        console.error(`Error converting chart "${key}" to image:`, error);
        images[key] = undefined;
      }
    } else {
      images[key] = undefined;
    }
  }

  return images;
}

/**
 * Validate a chart image data URL
 * Returns true if the image appears valid for PDF embedding
 */
export function validateChartImage(dataUrl: string | undefined): boolean {
  if (!dataUrl) return false;
  if (typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:image/')) return false;
  if (dataUrl.length < 100) return false;
  if (dataUrl.includes('undefined') || dataUrl.includes('null')) return false;
  return true;
}

/**
 * Filter chart images to only include valid ones
 */
export function filterValidChartImages(
  images: Record<string, string | undefined>
): Record<string, string> {
  const validImages: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(images)) {
    if (validateChartImage(value)) {
      validImages[key] = value as string;
    }
  }
  
  return validImages;
}
