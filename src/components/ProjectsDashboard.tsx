import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { FormField, Select, Button } from './ui/FormElements';
import type { Database } from '@/lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type UserType = 'contractor' | 'customer';
type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchUserTypeAndProjects = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Not authenticated');
          return;
        }

        // Get user type
        const userType = user.user_metadata.user_type as UserType;
        setUserType(userType);

        // Fetch projects based on user type
        const query = supabase
          .from('projects')
          .select('*');

        // If customer, only show their projects
        if (userType === 'customer') {
          query.eq('customer_id', user.id);
        }

        const { data: projectsData, error: projectsError } = await query;

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTypeAndProjects();
  }, [supabase]);

  const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Refresh projects list
      const { data: updatedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq(userType === 'customer' ? 'customer_id' : 'id', projectId);

      setProjects(prev => prev.map(p => 
        p.id === projectId ? (updatedProjects?.[0] || p) : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Projects Dashboard</h1>
        <div className="space-x-4">
          <Link 
            href="/referrals/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Referral
          </Link>
          <Link 
            href="/projects/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            New Project
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {projects.map((project) => (
            <li key={project.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{project.name}</h3>
                  <p className="text-gray-600">{project.description}</p>
                  <p className="text-sm text-gray-500">Estimated Completion: {new Date(project.estimated_completion).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {userType === 'contractor' ? (
                    <FormField label="Status">
                      <Select
                        value={project.status as ProjectStatus}
                        onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </FormField>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${(project.status as ProjectStatus) === 'completed' ? 'bg-green-100 text-green-800' : 
                        (project.status as ProjectStatus) === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        (project.status as ProjectStatus) === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  )}
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
