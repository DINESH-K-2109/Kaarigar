'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';

const skills = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Masonry',
  'Roofing',
  'Landscaping',
  'HVAC',
  'Appliance Repair',
  'Flooring',
  'Cleaning',
  'Moving',
  'General Labor',
];

interface Tradesman {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
  };
  skills: string[];
  experience: number;
  hourlyRate: number;
  city: string;
  bio: string;
  availability: string;
  rating: number;
  totalReviews: number;
  profileImage?: string;
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchForm, setSearchForm] = useState({
    skills: searchParams.get('skills') || '',
    city: searchParams.get('city') || '',
  });
  
  const [tradesmen, setTradesmen] = useState<Tradesman[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchForm({ ...searchForm, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchForm.skills && !searchForm.city) {
      setError('Please enter at least one search criteria');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      if (searchForm.skills) queryParams.append('skills', searchForm.skills);
      if (searchForm.city) queryParams.append('city', searchForm.city);

      const response = await fetch(`/api/tradesmen?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error fetching tradesmen');
      }

      setTradesmen(data.data);
      
      // Update URL with search params without causing a navigation
      const url = new URL(window.location.href);
      url.searchParams.set('skills', searchForm.skills);
      url.searchParams.set('city', searchForm.city);
      window.history.pushState({}, '', url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('skills') || searchParams.get('city')) {
      handleSearch();
    }
  }, []);

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Find Skilled Tradesmen
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Search for skilled tradesmen in your area based on the service you need.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Trade/Skill
                </label>
                <select
                  id="skills"
                  name="skills"
                  value={searchForm.skills}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Select a skill</option>
                  {skills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={searchForm.city}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Enter city name"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full md:w-auto btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Searching for tradesmen...</p>
              </div>
            ) : tradesmen.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tradesmen.map((tradesman) => (
                  <div
                    key={tradesman._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
                          {tradesman.profileImage ? (
                            <Image
                              src={tradesman.profileImage}
                              alt={tradesman.user.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-gray-500">
                              {tradesman.user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tradesman.user.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tradesman.city}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center mb-1">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="font-medium">
                            {tradesman.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({tradesman.totalReviews} reviews)
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          ₹{tradesman.hourlyRate}/hour
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tradesman.skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-3">
                          {tradesman.bio}
                        </p>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <Link
                          href={`/tradesmen/${tradesman._id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/chat/new?tradesman=${tradesman._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Contact
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tradesmen found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try different search criteria or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 