import { Outlet, Link, useLocation } from "react-router-dom";
import { Download, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/instagram-downloader", label: "Instagram" },
  { href: "/tiktok-downloader", label: "TikTok" },
  { href: "/youtube-downloader", label: "YouTube" },
  { href: "/x-downloader", label: "X" },
  { href: "/facebook-downloader", label: "Facebook" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">SaveFlex</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/40" data-testid="mobile-nav">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Download className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">SaveFlex</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The fastest way to download videos from your favorite social platforms.
            </p>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Platforms
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="footer-link text-sm hover:text-primary">
                    {link.label} Downloader
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">Privacy Policy</span>
              </li>
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">Terms of Service</span>
              </li>
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">DMCA</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">FAQ</span>
              </li>
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">Contact Us</span>
              </li>
              <li>
                <span className="footer-link text-sm cursor-pointer hover:text-primary">Report Issue</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} SaveFlex. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right max-w-xl">
              Disclaimer: SaveFlex is a tool for personal use only. We do not host any copyrighted content.
              Users are responsible for ensuring their downloads comply with applicable laws and platform terms.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background noise">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
