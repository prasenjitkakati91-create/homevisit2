import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any) {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp
  const d = date.toDate ? date.toDate() : new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip compression if not an image
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('Compression timed out, using original file');
      resolve(file);
    }, 5000);

    const reader = new FileReader();
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Smaller resolution for better size
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              if (blob) {
                // Return the compressed version, we need it as small as possible
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); 
              }
            },
            'image/jpeg',
            0.6 // Aggressive compression (60% quality)
          );
        } catch (e) {
          clearTimeout(timeout);
          resolve(file);
        }
      };
    };
    reader.readAsDataURL(file);
  });
}
