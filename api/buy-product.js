import { supabaseAdmin, jsonResponse } from './_utils.js';
import { getAuthenticatedUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });

  try {
    const user = await getAuthenticatedUser(req);
    const { product_id } = req.body;
    if (!product_id) return jsonResponse(res, 400, { error: 'Product ID required' });

    // 1. Product
    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', product_id).single();
    if (!product || !product.is_active) return jsonResponse(res, 404, { error: 'Product not found' });

    // 2. Stock check
    if (product.stock > 0) {
      const { count } = await supabaseAdmin.from('user_products')
        .select('*', { count: 'exact', head: true }).eq('product_id', product_id);
      if (count >= product.stock) return jsonResponse(res, 400, { error: 'Sold out' });
    }

    // 3. Wallet
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance, total_invested').eq('user_id', user.id).single();
    if (!wallet) return jsonResponse(res, 400, { error: 'Wallet not found' });
    if (Number(wallet.balance) < Number(product.price)) return jsonResponse(res, 400, { error: 'Insufficient balance. Please recharge.' });

    // 4. Create contract
    const endDate = new Date(Date.now() + product.term_days * 86400000);
    const { data: contract, error: cErr } = await supabaseAdmin.from('user_products').insert({
      user_id: user.id, product_id: product.id,
      purchase_price: product.price, daily_income: product.daily_income, term_days: product.term_days,
      end_date: endDate.toISOString()
    }).select().single();
    if (cErr) throw cErr;

    // 5. Deduct balance + record purchase
    await supabaseAdmin.from('wallets').update({
      balance: Number(wallet.balance) - Number(product.price),
      total_invested: Number(wallet.total_invested) + Number(product.price)
    }).eq('user_id', user.id);

    await supabaseAdmin.from('transactions').insert({
      user_id: user.id, type: 'purchase', amount: -Number(product.price),
      status: 'completed', reference: contract.id, description: `Purchased ${product.name}`
    });

    // 6. Pay B / C / D commissions
    const { data: me } = await supabaseAdmin.from('profiles')
      .select('full_name, upline_b, upline_c, upline_d').eq('id', user.id).single();
    const { data: settings } = await supabaseAdmin.from('settings').select('key, value');
    const pct = (k, d) => { const s = settings?.find(x => x.key === k); return s ? parseFloat(s.value) : d; };

    const tiers = [
      { level: 'B', upline: me?.upline_b, percent: pct('commission_b', 12) },
      { level: 'C', upline: me?.upline_c, percent: pct('commission_c', 6) },
      { level: 'D', upline: me?.upline_d, percent: pct('commission_d', 3) }
    ];

    for (const t of tiers) {
      if (!t.upline || t.percent <= 0) continue;
      const amount = Number(product.price) * (t.percent / 100);

      const { data: upWallet } = await supabaseAdmin.from('wallets').select('balance, team_income').eq('user_id', t.upline).single();
      if (!upWallet) continue;

      await supabaseAdmin.from('wallets').update({
        balance: Number(upWallet.balance) + amount,
        team_income: Number(upWallet.team_income) + amount
      }).eq('user_id', t.upline);

      await supabaseAdmin.from('transactions').insert({
        user_id: t.upline, type: 'commission', amount,
        status: 'completed', reference: contract.id,
        description: `Level ${t.level} commission from ${me?.full_name || 'a member'}`
      });

      await supabaseAdmin.from('commissions').insert({
        user_id: t.upline, from_user_id: user.id, level: t.level,
        percent: t.percent, amount, source_id: contract.id
      });
    }

    return jsonResponse(res, 200, { success: true, message: `${product.name} activated!` });
  } catch (e) {
    console.error('BUY ERROR:', e);
    return jsonResponse(res, 500, { error: e.message });
  }
}
