import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-[100dvh] w-full bg-orange-50 text-slate-800 font-sans relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#fb923c 2px, transparent 2px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        <i className="fa-solid fa-burger absolute top-20 left-10 text-6xl text-orange-400 rotate-12"></i>
        <i className="fa-solid fa-pizza-slice absolute top-40 right-10 text-5xl text-red-400 -rotate-12"></i>
        <i className="fa-solid fa-bowl-food absolute bottom-32 left-20 text-6xl text-yellow-500 rotate-45"></i>
        <i className="fa-solid fa-ice-cream absolute bottom-10 right-20 text-5xl text-pink-400 -rotate-12"></i>
      </div>

      {/* Main Container with Safe Area Handling */}
      {/* Added safe-pt (defined in index.html) and flex-col to keep nav fixed */}
      <div className="flex-1 flex flex-col w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-2xl relative z-10 border-x border-orange-100 overflow-hidden safe-pt">
        {children}
      </div>
    </div>
  );
};
