'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Reference = {
  id: string;
  project_id: string;
  referee_name: string;
  referee_email: string;
  status: string;
  feedback?: {
    rating: number;
    quality: number;
    timeliness: number;
    communication: number;
    comments: string;
  };
};

type Project = {
  id: string;
  title: string;
  description: string;
  contractor: {
    name: string;
    company_name: string;
  };
};

export default function ReferencePage({ params }: { params: { id: string } }) {
  const [reference, setReference] = useState<Reference | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadReference();
  }, []);

  async function loadReference() {
    try {
      // Load reference
      const { data: referenceData, error: referenceError } = await supabase
        .from('project_references')
        .select('*')
        .eq('id', params.id)
        .single();

      if (referenceError) throw referenceError;
      if (!referenceData) throw new Error('Reference not found');

      setReference(referenceData);

      // Load project with contractor details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          contractors (
            name,
            company_name
          )
        `)
        .eq('id', referenceData.project_id)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Project not found');

      setProject(projectData);
    } catch (err) {
      console.error('Error loading reference:', err);
      setError('Failed to load reference');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const feedback = {
      rating: parseInt(formData.get('rating') as string),
      quality: parseInt(formData.get('quality') as string),
      timeliness: parseInt(formData.get('timeliness') as string),
      communication: parseInt(formData.get('communication') as string),
      comments: formData.get('comments') as string,
    };

    try {
      const { error: updateError } = await supabase
        .from('project_references')
        .update({
          status: 'submitted',
          feedback,
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      setReference(prev => prev ? { ...prev, status: 'submitted', feedback } : null);
    } catch (err) {
      console.error('Error submitting reference:', err);
      setError('Failed to submit reference');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (!reference || !project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-red-600">
        Reference not found
      </div>
    );
  }

  if (reference.status === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-green-600 mb-4">Thank You!</h2>
          <p className="text-gray-600 text-center">
            Your reference has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Reference Request
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contractor</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.contractor.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.contractor.company_name}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Project</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.title}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.description}</dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Overall Rating
                </label>
                <select
                  name="rating"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a rating</option>
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>
                      {num} - {num === 5 ? 'Excellent' : 
                              num === 4 ? 'Very Good' :
                              num === 3 ? 'Good' :
                              num === 2 ? 'Fair' : 'Poor'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quality of Work
                </label>
                <select
                  name="quality"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a rating</option>
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeliness
                </label>
                <select
                  name="timeliness"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a rating</option>
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Communication
                </label>
                <select
                  name="communication"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a rating</option>
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Comments
                </label>
                <textarea
                  name="comments"
                  rows={4}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please share your experience working with this contractor..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Reference'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
