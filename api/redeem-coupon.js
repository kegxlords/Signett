import { supabaseAdmin, jsonResponse } from './_utils.js';
import { getAuthenticatedUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getAuthenticatedUser(req);
    const { code } = req.body;
    if (!code) return jsonResponse(res, 400, { error: 'Enter a coupon code' });

    const { data: coupon } = await supabaseAdmin.from('coupons')
      .select('*').eq('code', code.trim().toUpperCase()).single();
    if (!coupon || !coupon.is_active) return jsonResponse(res, 404, { error: 'Invalid coupon code' });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return jsonResponse(res, 400, { error: 'Coupon expired' });
    if (coupon.used_count >= coupon.max_uses) return jsonResponse(res, 400, { error: 'Coupon fully redeemed' });

    const { data: already } = await supabaseAdmin.from('coupon_redemptions')
      .select('id').eq('coupon_id', coupon.id).eq('user_id', user.id).single();
    if (already) return jsonResponse(res, 400, { error: 'You have already redeemed this coupon' });

    // Determine credit amount
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance, total_invested').eq('user_id', user.id).single();
    let amount = 0;
    if (coupon.type === 'amount') amount = Number(coupon.value);
    else {
      if (Number(wallet.total_invested) < Number(coupon.min_purchase))
        return jsonResponse(res, 400, { error: `This coupon requires ₦${Number(coupon.min_purchase).toLocaleString()} total investment` });
      amount = Number(wallet.total_invested) * (Number(coupon.value) / 100);
    }
    if (amount <= 0) return jsonResponse(res, 400, { error: 'Coupon value invalid' });

    // Credit + records
    await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + amount }).eq('user_id', user.id);
    await supabaseAdmin.from('coupon_redemptions').insert({ coupon_id: coupon.id, user_id: user.id, amount_credited: amount });
    await supabaseAdmin.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id);
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id, type: 'coupon', amount, status: 'completed',
      reference: coupon.id, description: `Coupon redeemed: ${coupon.code}`
    });

    return jsonResponse(res, 200, { success: true, amount });
  } catch (e) {
    console.error('COUPON ERROR:', e);
    return jsonResponse(res, 500, { error: e.message });
  }
}
