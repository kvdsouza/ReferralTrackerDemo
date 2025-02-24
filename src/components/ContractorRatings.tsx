import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ratings = {
  average_rating: number;
  average_quality: number;
  average_timeliness: number;
  average_communication: number;
  total_references: number;
};

export default function ContractorRatings() {
  const [ratings, setRatings] = useState<Ratings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadRatings();
  }, []);

  async function loadRatings() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .rpc('get_contractor_ratings', { contractor_uuid: user.id });

      if (error) throw error;
      setRatings(data[0]);
    } catch (err) {
      console.error('Error loading ratings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return null;
  if (!ratings) return null;

  const ratingCategories = [
    { label: 'Overall Rating', value: ratings.average_rating },
    { label: 'Quality of Work', value: ratings.average_quality },
    { label: 'Timeliness', value: ratings.average_timeliness },
    { label: 'Communication', value: ratings.average_communication },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Your Ratings ({ratings.total_references} references)
      </h3>
      
      <div className="space-y-4">
        {ratingCategories.map(category => (
          <div key={category.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{category.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {category.value ? category.value.toFixed(1) : 'N/A'} / 5.0
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${(category.value / 5) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
