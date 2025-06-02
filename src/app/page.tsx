import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Find Skilled Tradesmen Near You
            </h1>
            <p className="mt-6 text-xl max-w-2xl mx-auto">
              Kaarigar connects you with skilled tradesmen in your area for all your home and business needs.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Find a Tradesman
              </Link>
              <Link
                href="/tradesmen/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Register as Tradesman
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How Kaarigar Works
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Connecting skilled tradesmen with customers in just a few simple steps.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Search</h3>
              <p className="mt-2 text-base text-gray-500">
                Search for tradesmen based on your location and the service you need.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">
                Connect
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Chat with tradesmen to discuss your project, timeline, and budget.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Hire</h3>
              <p className="mt-2 text-base text-gray-500">
                Hire the tradesman that best fits your needs and get your job done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Popular Services
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Find skilled professionals for all your needs.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Plumbing', icon: '🔧' },
              { title: 'Electrical', icon: '⚡' },
              { title: 'Carpentry', icon: '🪚' },
              { title: 'Painting', icon: '🖌️' },
              { title: 'Masonry', icon: '🧱' },
              { title: 'Roofing', icon: '🏠' },
              { title: 'Landscaping', icon: '🌱' },
              { title: 'HVAC', icon: '❄️' },
            ].map((service) => (
              <Link
                key={service.title}
                href={`/search?skills=${service.title}`}
                className="group relative bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition duration-150"
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl mb-4">{service.icon}</span>
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-300">
              Find a tradesman or register today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-4">
            <Link
              href="/search"
              className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
            >
              Find a Tradesman
            </Link>
            <Link
              href="/tradesmen/register"
              className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Register as Tradesman
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
} 