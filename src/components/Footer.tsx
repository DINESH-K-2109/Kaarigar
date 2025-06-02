'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">KAARIGAR</h2>
            <p className="text-gray-300">
              Connecting skilled tradesmen with people who need their services.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-300 hover:text-white">
                  Find Tradesmen
                </Link>
              </li>
              <li>
                <Link href="/tradesmen/register" className="text-gray-300 hover:text-white">
                  Register as Tradesman
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-gray-300 hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-gray-300 hover:text-white">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: info@kaarigar.com</li>
              <li>Phone: +91 1234567890</li>
              <li>Address: 123 Main Street, City, Country</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} KAARIGAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 