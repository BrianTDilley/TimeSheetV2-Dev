import React, { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onEnd: (base64: string | null) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution for better quality on high DPI screens
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Prevent scrolling when touching the canvas
    if ('touches' in e) {
      // e.preventDefault(); // Commented out to allow document scroll if needed, but usually preferred to block on canvas
    }

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
        // Return null if empty, but we set hasSignature to true on first touch
        // Ideally we check if pixels exist, but simple flag is okay for now
        onEnd(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onEnd(null);
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair rounded-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <div className="absolute top-2 right-2">
            <button 
                onClick={clear}
                className="p-1 bg-white rounded shadow text-gray-500 hover:text-red-500 transition-colors"
                type="button"
            >
                <Eraser size={16} />
            </button>
        </div>
        {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Sign here with your finger</p>
            </div>
        )}
      </div>
    </div>
  );
};