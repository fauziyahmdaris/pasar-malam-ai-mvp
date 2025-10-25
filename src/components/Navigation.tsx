import { Button } from "@/components/ui/button";
import { Store, User, Shield } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary">Pasar</span>
              <span className="text-secondary">Malam</span>
              <span className="text-accent">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth/admin'}>
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'}>
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
            <Button variant="default" size="sm" onClick={() => window.location.href = '/auth'}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
