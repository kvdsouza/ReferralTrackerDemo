import { createClient } from '@supabase/supabase-js';

// This is a placeholder for actual CRM integration
// In a real implementation, you would integrate with the contractor's specific CRM

export async function checkProjectCompletion(contractorId: string, crmId: string) {
  try {
    // This would be replaced with actual CRM API calls
    // For now, we'll simulate checking project status
    
    // Example implementation:
    // const crm = new CRMClient(process.env.CRM_API_KEY);
    // const project = await crm.projects.get(crmId);
    // return project.status === 'completed';
    
    return true; // Simulating a completed project
  } catch (error) {
    console.error('Error checking project completion:', error);
    return false;
  }
}

export async function handleProjectCompletion(
  supabase: ReturnType<typeof createClient>,
  contractorId: string,
  customerId: string
) {
  try {
    // Generate referral code
    const response = await fetch('/api/referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractorId,
        customerId,
        rewardType: 'gift_card',
        rewardAmount: 50,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate referral code');
    }

    const { referralCode } = await response.json();

    // Send communications
    await fetch('/api/communications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractorId,
        customerId,
        referralCode: referralCode.code,
      }),
    });

    return true;
  } catch (error) {
    console.error('Error handling project completion:', error);
    return false;
  }
}

// Function to periodically check for completed projects
export async function startProjectCompletionChecker(
  supabase: ReturnType<typeof createClient>,
  contractorId: string
) {
  setInterval(async () => {
    try {
      // Get contractor's CRM ID
      const { data: contractor, error: contractorError } = await supabase
        .from('users')
        .select('crm_id')
        .eq('id', contractorId)
        .single();

      if (contractorError || !contractor?.crm_id) {
        return;
      }

      // Check for completed projects
      const isCompleted = await checkProjectCompletion(contractorId, contractor.crm_id);

      if (isCompleted) {
        // Get customer ID from CRM or database
        // This is a placeholder - you would get this from your CRM integration
        const customerId = 'example-customer-id';

        await handleProjectCompletion(supabase, contractorId, customerId);
      }
    } catch (error) {
      console.error('Error in project completion checker:', error);
    }
  }, 1000 * 60 * 5); // Check every 5 minutes
}
