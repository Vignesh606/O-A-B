"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { useAuth, UserButton } from "@clerk/nextjs";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            <Link href="/" className="font-semibold text-[#635BFF]">
              Catalog
            </Link>
            <Link href="/models" className="font-medium text-[#0A2540] hover:text-[#635BFF] transition-colors">
              All Models
            </Link>
            <a href="#models-catalog-container" className="font-medium text-[#0A2540] hover:text-[#635BFF] transition-colors">
              AI Labs
            </a>
            <Link href="/models/deepseek-r1" className="font-medium text-[#0A2540] hover:text-[#635BFF] transition-colors">
              Providers & Routing
            </Link>
            <a href="https://models.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-[#0A2540] hover:text-[#635BFF] transition-colors">
              API Specs
            </a>
          </div>

          {/* Desktop right */}
          <div className="nav-right nav-right-desktop">
            {isLoaded && isSignedIn ? (
              <>
                <Link className="signin" href="/dashboard">Dashboard</Link>
                <div className="flex items-center">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link className="signin" href="/login">Sign In</Link>
                <Link className="cta-primary" href="/signup">Get API Key</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              /* X icon */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="nav-mobile-menu">
            <div className="nav-mobile-links">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                Catalog
              </Link>
              <Link href="/models" onClick={() => setMenuOpen(false)}>
                All Models
              </Link>
              <a href="#models-catalog-container" onClick={() => setMenuOpen(false)}>
                AI Labs
              </a>
              <Link href="/models/deepseek-r1" onClick={() => setMenuOpen(false)}>
                Providers & Routing
              </Link>
            </div>
            <div className="nav-mobile-ctas">
              {isLoaded && isSignedIn ? (
                <>
                  <Link href="/dashboard" className="nav-mobile-signin" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <div className="flex items-center justify-center p-2">
                    <UserButton />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-mobile-signin" onClick={() => setMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="nav-mobile-cta" onClick={() => setMenuOpen(false)}>
                    Get API Key
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}