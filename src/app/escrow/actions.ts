'use server';

import { createClient } from '@/utils/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function cancelTransactionAction(transactionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const admin = createServerSupabaseClient();

    // 1. Fetch transaction
    const { data: tx, error: txError } = await admin
      .from('transactions')
      .select('*, listing:listings(price)')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) {
      return { success: false, error: 'Transaction not found' };
    }

    // Only buyer can cancel
    if (tx.buyer_id !== user.id) {
      return { success: false, error: 'Only the buyer can cancel this transaction.' };
    }

    // Only cancel if not completed
    if (tx.status === 'completed' || tx.status === 'cancelled') {
      return { success: false, error: 'Cannot cancel a completed or already cancelled transaction.' };
    }

    // 2. Refund Buyer
    const price = tx.listing?.price || 0;
    if (price > 0) {
      // Get buyer's current balance
      const { data: buyerData } = await admin
        .from('users')
        .select('balance')
        .eq('id', tx.buyer_id)
        .single();
      
      const newBalance = (buyerData?.balance || 0) + price;

      await admin
        .from('users')
        .update({ balance: newBalance })
        .eq('id', tx.buyer_id);
    }

    // 3. Penalize Seller Rating
    const { data: sellerData } = await admin
      .from('users')
      .select('rating')
      .eq('id', tx.seller_id)
      .single();

    const currentRating = sellerData?.rating ?? 5.0;
    const newRating = Math.max(1.0, currentRating - 0.5); // Penalty -0.5 points

    await admin
      .from('users')
      .update({ rating: newRating })
      .eq('id', tx.seller_id);

    // 4. Update Transaction Status
    await admin
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId);

    // 5. Revert Listing to Available
    if (tx.listing_id) {
      await admin
        .from('listings')
        .update({ status: 'available' })
        .eq('id', tx.listing_id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
