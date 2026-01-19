import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // Changed min-h-screen to h-[100dvh] to fix mobile scroll issues by constraining to viewport height
    <div className="h-[100dvh] w-full bg-orange-50 text-slate-800 font-sans relative overflow-hidden">
       {/* Background Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#fb923c 2px, transparent 2px)',
            backgroundSize: '30px 30px'
        }}></div>
        
        {/* Scattered Icons */}
        <i className="fa-solid fa-burger absolute top-10 left-10 text-6xl text-orange-400 rotate-12"></i>
        <i className="fa-solid fa-pizza-slice absolute top-40 right-10 text-5xl text-red-400 -rotate-12"></i>
        <i className="fa-solid fa-bowl-food absolute bottom-32 left-20 text-6xl text-yellow-500 rotate-45"></i>
        <i className="fa-solid fa-ice-cream absolute bottom-10 right-20 text-5xl text-pink-400 -rotate-12"></i>
        <i className="fa-solid fa-carrot absolute top-1/2 left-5 text-4xl text-green-500 rotate-90"></i>
        <i className="fa-solid fa-mug-hot absolute top-1/3 right-1/3 text-4xl text-stone-400 rotate-6"></i>
      </div>

      <div className="h-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-2xl relative flex flex-col z-10 border-x border-orange-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
};