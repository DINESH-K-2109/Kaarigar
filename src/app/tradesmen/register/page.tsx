'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  'Other',
];

export default function RegisterTradesman() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: [] as string[],
    otherSkill: '',
    experience: '',
    hourlyRate: '',
    city: '',
    bio: '',
    availability: '',
    profileImage: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        skills: [...formData.skills, value],
      });
    } else {
      setFormData({
        ...formData,
        skills: formData.skills.filter((skill) => skill !== value),
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Prepare skills list
    let finalSkills = [...formData.skills];
    if (formData.otherSkill && !finalSkills.includes('Other')) {
      finalSkills.push(formData.otherSkill);
    }

    // Validate form
    if (
      !formData.name ||
      !formData.phone ||
      finalSkills.length === 0 ||
      !formData.experience ||
      !formData.hourlyRate ||
      !formData.city ||
      !formData.bio ||
      !formData.availability
    ) {
      setError('All fields are required');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/tradesmen/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          skills: finalSkills,
          experience: parseInt(formData.experience),
          hourlyRate: parseFloat(formData.hourlyRate),
          city: formData.city,
          bio: formData.bio,
          availability: formData.availability,
          profileImage: formData.profileImage,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Redirect to home page on successful registration
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Register as a Tradesman
            </h1>
            
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-3 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skills (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skills.map((skill) => (
                    <div key={skill} className="flex items-center">
                      <input
                        id={`skill-${skill}`}
                        name={`skill-${skill}`}
                        type="checkbox"
                        value={skill}
                        checked={formData.skills.includes(skill)}
                        onChange={handleSkillChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`skill-${skill}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.skills.includes('Other') && (
                <div>
                  <label
                    htmlFor="otherSkill"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Other Skill (please specify)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="otherSkill"
                      id="otherSkill"
                      value={formData.otherSkill}
                      onChange={handleChange}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="experience"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Years of Experience
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="experience"
                      id="experience"
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="hourlyRate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hourly Rate (₹)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="hourlyRate"
                      id="hourlyRate"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700"
                >
                  City
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bio/Description
                </label>
                <div className="mt-1">
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                    maxLength={500}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 500 characters. Describe your skills, experience and the type of work you do.
                </p>
              </div>

              <div>
                <label
                  htmlFor="availability"
                  className="block text-sm font-medium text-gray-700"
                >
                  Availability
                </label>
                <div className="mt-1">
                  <select
                    name="availability"
                    id="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select availability</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Weekends only">Weekends only</option>
                    <option value="Evenings only">Evenings only</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profileImage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Profile Image URL (optional)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="profileImage"
                    id="profileImage"
                    value={formData.profileImage}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="https://example.com/your-image.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Registering...' : 'Register as Tradesman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 