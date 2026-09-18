/**
 * ImgBB Image Upload Service
 * Uploads character layer images to ImgBB and returns hosted URLs
 */

export interface ImgBBUploadResult {
  success: boolean;
  url: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  title?: string;
  id?: string;
  error?: string;
}

const FALLBACK_IMGBB_API_KEY = '9cf974acba9d5d5d715bf14db07d697a';

/**
 * Upload an image (base64 data URL or File) to ImgBB.
 * First tries the backend proxy (/api/upload-imgbb) to keep credentials secure,
 * and falls back directly to ImgBB API if needed.
 */
export async function uploadImageToImgBB(
  imageSource: string | File,
  filename?: string
): Promise<ImgBBUploadResult> {
  let base64String = '';
  let finalName = filename || 'character_layer';

  if (imageSource instanceof File) {
    finalName = imageSource.name;
    base64String = await fileToBase64(imageSource);
  } else {
    base64String = imageSource;
  }

  // 1. Try server-side proxy route first
  try {
    const res = await fetch('/api/upload-imgbb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64String,
        name: finalName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return {
          success: true,
          url: data.url,
          displayUrl: data.display_url || data.url,
          thumbUrl: data.thumb_url,
          deleteUrl: data.delete_url,
          title: data.title,
          id: data.id,
        };
      }
    }
  } catch (err) {
    console.warn('Server proxy /api/upload-imgbb attempt failed, trying direct upload...', err);
  }

  // 2. Direct fallback to ImgBB API using the user-provided API key
  try {
    let cleanBase64 = base64String;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    const formData = new FormData();
    formData.append('image', cleanBase64);
    if (finalName) {
      formData.append('name', finalName);
    }

    const directRes = await fetch(`https://api.imgbb.com/1/upload?key=${FALLBACK_IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const directData = await directRes.json();
    if (directData.success && directData.data) {
      return {
        success: true,
        url: directData.data.url,
        displayUrl: directData.data.display_url || directData.data.url,
        thumbUrl: directData.data.thumb?.url,
        deleteUrl: directData.data.delete_url,
        title: directData.data.title,
        id: directData.data.id,
      };
    } else {
      return {
        success: false,
        url: '',
        error: directData.error?.message || 'ImgBB upload rejected',
      };
    }
  } catch (directErr: any) {
    console.error('Direct ImgBB upload error:', directErr);
    return {
      success: false,
      url: '',
      error: directErr.message || 'Network error connecting to ImgBB',
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
