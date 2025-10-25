import { Button } from "@/components/ui/button";
import { MapPin, ShoppingBag, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-pasar-malam.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Malaysian Night Market" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Taiping, Perak - Pasar Malam Batu 2 1/2</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PasarMalamAI
            </span>
            <br />
            <span className="text-foreground">Digital Marketplace</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Empowering Malaysian hawkers and sellers with AI-driven insights, seamless pre-orders, and digital payments
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="min-w-[200px]" onClick={() => window.location.href = '/auth'}>
              <ShoppingBag className="w-5 h-5" />
              Browse Market
            </Button>
            <Button variant="secondary" size="lg" className="min-w-[200px]" onClick={() => window.location.href = '/auth'}>
              <TrendingUp className="w-5 h-5" />
              Seller Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Active Sellers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-secondary">1000+</div>
              <div className="text-sm text-muted-foreground">Pre-Orders</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-accent">24/7</div>
              <div className="text-sm text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-primary/50" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
