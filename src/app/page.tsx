import Link from 'next/link';
import { Eye, Shield, Smartphone, Printer, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  const features = [
    {
      title: 'Digital Prescriptions',
      description: 'Record and track complex Right & Left eye spherical, cylindrical, axis, and vision values.',
      icon: Eye,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      title: 'Thermal & Standard Printing',
      description: 'Print beautiful, custom-styled receipt envelopes directly matching Malhotra Opticals physical specs.',
      icon: Printer,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'WhatsApp Automation',
      description: 'Send custom booking invoices, readiness updates, and balance reminders using click-to-chat templates.',
      icon: Smartphone,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'Secure & Multi-Tenant',
      description: 'Isolated data encryption ensures shop owners can only see their registered patients and balance metrics.',
      icon: Shield,
      color: 'text-amber-500 bg-amber-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white font-sans overflow-hidden flex flex-col justify-between">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>

      {/* Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Eye className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            OptiFlow
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-bold text-xs py-2 px-4.5">
              Register Shop
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        
        {/* Left column hero text */}
        <div className="space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            Modern SaaS for Opticians
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Streamline your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Optical Business.</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Manage customer records, input ocular prescriptions, print receipt envelopes, and send WhatsApp reminder notifications dynamically.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-bold flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-slate-300 border-white/10 hover:bg-white/5 cursor-pointer font-bold">
                Access Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Right column features layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
          
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`p-3 w-fit rounded-xl ${feature.color} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{feature.description}</p>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center text-xs text-slate-500 font-semibold tracking-wide uppercase">
        © 2026 OptiFlow SaaS Platform. Designed for modern optical clinics.
      </footer>

    </div>
  );
}
