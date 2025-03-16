// src/components/ui/Spinner.js
export default function Spinner({ size = 'md', color = 'blue' }) {
    // Boyut sınıfları
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16'
    };
    
    // Renk sınıfları
    const colorClasses = {
      blue: 'border-blue-500',
      gray: 'border-gray-500',
      green: 'border-green-500',
      red: 'border-red-500',
      yellow: 'border-yellow-500'
    };
    
    // Seçilen boyut ve renk
    const selectedSize = sizeClasses[size] || sizeClasses.md;
    const selectedColor = colorClasses[color] || colorClasses.blue;
    
    return (
      <div className={`animate-spin rounded-full ${selectedSize} border-t-2 border-b-2 ${selectedColor}`}></div>
    );
  }