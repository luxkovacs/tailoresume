import React, { ReactNode } from 'react';
import Navbar from './Navbar'; // Assuming Navbar.tsx is in the same directory
import { Link } from 'react-router-dom'; // For footer links

interface LayoutProps {
  children: ReactNode;
}

const Footer: React.FC = () => {
  return (
    <footer className="relative py-12 bg-gray-200 dark:bg-gray-950 border-t border-gray-300 dark:border-gray-700 z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Tailoresume</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">About Us</Link></li>
              <li><Link to="/features" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Features</Link></li>
              {/* Add other relevant links here */}
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Support</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Legal</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Connect</h5>
            {/* Add social media links/icons here if desired */}
            <p className="text-sm text-gray-600 dark:text-gray-400">GitHub, LinkedIn, etc.</p>
          </div>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-500 text-sm pt-8 border-t border-gray-300 dark:border-gray-700">
          &copy; {new Date().getFullYear()} Tailoresume. All rights reserved.
          <p className="mt-1">Built with <span className="text-red-500">&hearts;</span> and a lot of coffee.</p>
        </div>
      </div>
    </footer>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
