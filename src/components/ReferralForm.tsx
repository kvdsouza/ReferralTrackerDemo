import { useState } from 'react';
import { FormField, Input, TextArea, Button } from '@/components/ui/FormElements';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReferralForm() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          projectDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create referral');
      }

      setSuccess(true);
      // Clear form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setProjectDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Refer a Customer</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative">
          Referral created successfully! An email has been sent to {customerEmail}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Customer Name">
          <Input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer's name"
          />
        </FormField>

        <FormField label="Customer Email">
          <Input
            type="email"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Enter customer's email"
          />
        </FormField>

        <FormField label="Customer Phone">
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter customer's phone number (optional)"
          />
        </FormField>

        <FormField label="Project Description">
          <TextArea
            required
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Describe the project or customer needs"
            rows={4}
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <LoadingSpinner size="small" color="text-white" />
            ) : (
              'Create Referral'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
