// src/components/ui/Image.js
import NextImage from 'next/image';
import { useState } from 'react';

export default function Image({ src, alt, width, height, className, priority = false, sizes = "100vw", ...rest }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Eğer src boş veya bir data URL ise
  if (!src || src.startsWith('data:')) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 ${className}`} 
        style={{ width: width || '100%', height: height || 300 }}
        {...rest}
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Görsel yok</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`overflow-hidden ${className}`} {...rest}>
      <NextImage
        src={src}
        alt={alt || 'Görsel'}
        width={width || 1200}
        height={height || 800}
        style={{ objectFit: 'cover' }} // Kullanımdan kaldırılan objectFit prop'u yerine
        className={`transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        priority={priority} // Önemli görseller için öncelik bayrağı ekle
        sizes={sizes} // Duyarlı boyutlandırma
        loading={priority ? 'eager' : 'lazy'} // Öncelikli olmadığında lazy loading uygula
        placeholder="blur" // Bulanık placeholder göster
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        quality={85} // Optimal kalite ayarla
      />
    </div>
  );
}