import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, ArrowLeft, CheckCircle, 
  BookOpen, Users, Globe, Shield 
} from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl tracking-tight text-slate-900">
            <div className="bg-gradient-to-tr from-landing-accent to-landing-secondary text-white p-2 rounded-xl shadow-lg shadow-landing-accent/20">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            doonITes ERP
          </Link>
          
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-landing-accent transition-colors font-medium">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero / Header Section */}
      <header className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-landing-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-landing-accent to-landing-secondary">Touch</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            We'd love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          {/* Contact Information Card */}
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-landing-accent/10 to-blue-500/10 rounded-bl-[100px] -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
            
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 relative z-10">Contact Us</h2>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-start gap-6 group/item">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300 shadow-sm">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Call Us</h3>
                  <p className="text-slate-500 mb-2">Mon-Fri from 8am to 5pm.</p>
                  <a href="tel:+919258622022" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    +91 92586 22022
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group/item">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-300 shadow-sm">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Email Us</h3>
                  <p className="text-slate-500 mb-2">Speak to our friendly team.</p>
                  <a href="mailto:erp@geenie.org" className="text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                    erp@geenie.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group/item">
                <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-all duration-300 shadow-sm">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Visit Us</h3>
                  <p className="text-slate-500 mb-2">Come say hello at our office HQ.</p>
                  <p className="text-slate-700 font-medium">
                    doonITes ERP HQ<br/>
                    Tech Park, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* About Us Section */}
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Globe size={14} />
                About Us
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-6">
                Transforming Education Management
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                doonITes ERP is a comprehensive school management solution designed to simplify daily operations and enhance teaching, learning, and communication across the campus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: CheckCircle, text: "Simplify Operations", color: "text-emerald-500" },
                { icon: Users, text: "Enhance Communication", color: "text-blue-500" },
                { icon: BookOpen, text: "Improve Learning", color: "text-purple-500" },
                { icon: Shield, text: "Secure Data", color: "text-orange-500" }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                  <feature.icon size={20} className={feature.color} />
                  <span className="font-bold text-slate-700">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden mt-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
              <p className="text-slate-400 mb-6">Join hundreds of schools already using doonITes ERP.</p>
              <Link to="/#demo" className="inline-block w-full text-center bg-white text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-100 transition-colors">
                Request a Demo
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Simple */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <div className="container mx-auto px-6">
          <p>© {new Date().getFullYear()} doonITes ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
