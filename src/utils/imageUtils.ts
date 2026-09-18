/**
 * Utility functions for handling image preview, upload, and download
 */

export async function downloadPngImage(
  imageSource: string,
  fileName: string = 'Head.png',
  defaultWidth: number = 311,
  defaultHeight: number = 401
): Promise<void> {
  try {
    // If it's already a PNG data URL, trigger download directly
    if (imageSource.startsWith('data:image/png')) {
      const link = document.createElement('a');
      link.href = imageSource;
      link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Otherwise render to an offscreen canvas to guarantee PNG export
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = imageSource;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || defaultWidth;
    canvas.height = img.naturalHeight || defaultHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  } catch (error) {
    console.error('Failed to download image:', error);
    // Fallback direct link
    const link = document.createElement('a');
    link.href = imageSource;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function readUploadedImage(file: File): Promise<{
  dataUrl: string;
  name: string;
  width: number;
  height: number;
}> {
  return optimizeImageForFirestore(file);
}

export function optimizeImageForFirestore(file: File, maxDimension = 800): Promise<{
  dataUrl: string;
  name: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (PNG, JPG, SVG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      // If it's an SVG, preserve original SVG vector string
      if (file.type.includes('svg') || file.name.endsWith('.svg')) {
        resolve({
          dataUrl: src,
          name: file.name.replace(/\.[^/.]+$/, ''),
          width: 300,
          height: 300,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: src,
            name: file.name.replace(/\.[^/.]+$/, ''),
            width,
            height,
          });
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // PNG preserves full alpha channel transparency for character layers
        const optimizedUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl: optimizedUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to parse uploaded image'));
      img.src = src;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
