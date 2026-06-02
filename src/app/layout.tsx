import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  Settings,
  BarChart2,
  Home,
  Shield,
} from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WM 2026 Tippspiel",
  description: "Fußball WM 2026 Tippspiel",
};

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/spielplan", label: "Spielplan", icon: Calendar },
  { href: "/rangliste", label: "Rangliste", icon: Trophy },
  { href: "/gruppen", label: "Gruppen", icon: Shield },
  { href: "/statistik", label: "Statistik", icon: BarChart2 },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-emerald-600 rounded-lg p-1.5 group-hover:bg-emerald-500 transition-colors">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight hidden sm:block">
                  WM 2026 Tippspiel
                </span>
                <span className="font-bold text-lg text-white tracking-tight sm:hidden">
                  WM 2026
                </span>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden md:block">{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-800 border-t border-slate-700 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-slate-400 text-xs">
            <span>WM 2026 Tippspiel</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Viel Erfolg!
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
