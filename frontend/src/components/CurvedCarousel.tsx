import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CAROUSEL_ITEMS = [
  {
    image: 'https://i.pinimg.com/736x/bd/90/8d/bd908d55e7470836489830c877a98ba1.jpg',
    title: 'Match 1',
  },
  {
    image: 'https://i.pinimg.com/736x/7d/8c/cd/7d8ccddd1a01cf6d00f9f653877a39dc.jpg',
    title: 'Match 2',
  },
  {
    image: 'https://i.pinimg.com/736x/2d/14/5a/2d145affbae44c262bca0710399d2891.jpg',
    title: 'Match 3',
  },
  {
    image: 'https://i.pinimg.com/736x/83/57/b6/8357b60aa4071d194bdadb935ef5db26.jpg',
    title: 'Match 4',
  },
  {
    image: 'https://i.pinimg.com/736x/0d/e0/27/0de0275fca2cf514d09ca6f64bf14c70.jpg',
    title: 'Match 5',
  }
];

export default function CurvedCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-play interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full py-20 flex flex-col items-center justify-center bg-transparent overflow-hidden perspective-[1200px]">
      
      {/* Title block like the reference image */}
      <div className="text-center mb-16 z-20 px-4">
        <h2 className="text-4xl md:text-6xl font-normal text-white mb-4 leading-tight" style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
          Connect Instantly with<br/>Anyone, Anywhere
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm md:text-lg">
          Experience real-time video connections with zero latency, high-definition quality, and strict privacy protection.
        </p>
      </div>

      {/* The 3D Carousel Stage */}
      <div className="relative w-full h-[550px] md:h-[700px] flex items-center justify-center transform-3d mb-16">
        
        <AnimatePresence mode="popLayout">
          {CAROUSEL_ITEMS.map((item, i) => {
            // Calculate relative offset (-2, -1, 0, 1, 2)
            let offset = (i - activeIndex + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length;
            if (offset > CAROUSEL_ITEMS.length / 2) {
              offset -= CAROUSEL_ITEMS.length;
            }

            // Only render items that are somewhat visible (offset between -2 and 2)
            if (Math.abs(offset) > 2) return null;

            // 3D Math Logic
            const xOffset = offset * 150; // Base horizontal spacing
            const zOffset = -Math.abs(offset) * 80; // Depth push back
            const rotateY = offset * -25; // Tilt inwards
            const scale = 1 - Math.abs(offset) * 0.15;
            const opacity = 1 - Math.abs(offset) * 0.3;
            const zIndex = 10 - Math.abs(offset);

            return (
              <motion.div
                key={i}
                onClick={() => setActiveIndex(i)}
                className="absolute w-[240px] h-[500px] md:w-[320px] md:h-[640px] rounded-[36px] md:rounded-[48px] bg-black border-[6px] md:border-[8px] border-black shadow-2xl cursor-pointer"
                style={{ zIndex }}
                initial={{ opacity: 0, x: offset > 0 ? 200 : -200, z: -200, rotateY: offset > 0 ? -40 : 40, scale: 0.5 }}
                animate={{ 
                  x: xOffset, 
                  z: zOffset, 
                  rotateY: rotateY, 
                  scale: scale, 
                  opacity: opacity 
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.1 }}
              >
                {/* Dynamic Island / Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] md:w-[100px] h-[20px] md:h-[26px] bg-black rounded-full z-30" />
                
                {/* Screen Content Wrapper */}
                <div className="relative w-full h-full rounded-[28px] md:rounded-[38px] overflow-hidden bg-zinc-900 border border-white/10">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlay to darken edges of non-active cards */}
                  <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${Math.abs(offset) > 0 ? 'bg-black/50' : 'bg-transparent'}`} />

                  {/* Home Indicator (Bottom Line) */}
                  <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 w-[35%] h-[4px] md:h-[5px] bg-white/80 rounded-full z-30 pointer-events-none" />

                  {/* Subtle shine effect on the edges based on rotation */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${offset < 0 ? 'from-white/20 to-transparent' : offset > 0 ? 'from-transparent to-white/20' : 'hidden'} mix-blend-overlay pointer-events-none`} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Three Column Feature Text Below */}
      <div className="w-full max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 z-20">
        <div className="text-center border p-4 border-white/10 rounded-2xl border-2">
          <h3 className="text-white font-medium text-lg mb-2" style={{ fontFamily: 'Georgia, serif' }}>Lightning-Fast<br/>Connections</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Skip the waiting lines. Our optimized WebRTC infrastructure pairs you with people globally in milliseconds.
          </p>
        </div>
        <div className="text-center border p-4 border-white/10 rounded-2xl border-2 bg-white">
          <h3 className="text-black font-medium text-lg mb-2" style={{ fontFamily: 'Georgia, serif' }}>End-to-End<br/>Security</h3>
          <p className="text-zinc-600 text-sm leading-relaxed">
            Your identity is anonymous and your video streams are strictly peer-to-peer and fully encrypted.
          </p>
        </div>
        <div className="text-center border p-4 border-white/10 rounded-2xl border-2">
          <h3 className="text-white font-medium text-lg mb-2" style={{ fontFamily: 'Georgia, serif' }}>High-Resolution<br/>Video</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Experience face-to-face conversations in crisp 1080p without buffering or noticeable drops in frame rates.
          </p>
        </div>
      </div>

    </div>
  );
}
