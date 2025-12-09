const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'grid-move 20s linear infinite',
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float-fast" />
      
      {/* Glowing lines */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse-slow" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* Particles */}
      <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-primary rounded-full animate-particle" />
      <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-accent rounded-full animate-particle" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-primary rounded-full animate-particle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-accent rounded-full animate-particle" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/4 right-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-particle" style={{ animationDelay: '2s' }} />

      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scanline opacity-30" />
    </div>
  );
};

export default AnimatedBackground;
