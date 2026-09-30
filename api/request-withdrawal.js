import { supabaseAdmin, jsonResponse } from './_utils.js';
import { getAuthenticatedUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getAuthenticatedUser(req);
    const { amount, bank_account_id } = req.body;
    if (!amount || !bank_account_id) return jsonResponse(res, 400, { error: 'Missing fields' });

    // Settings: min + fee ONLY (no time window)
    const { data: settings } = await supabaseAdmin.from('settings').select('key, value');
    const g = (k, d) => { const x = settings?.find(i => i.key === k); return x ? parseFloat(x.value) : d; };
    const min = g('min_withdrawal', 1000), feePct = g('withdrawal_fee_percent', 8);

    if (amount < min) return jsonResponse(res, 400, { error: `Minimum withdrawal is ₦${min.toLocaleString()}` });

    // Bank must belong to user
    const { data: bank } = await supabaseAdmin.from('bank_accounts').select('*').eq('id', bank_account_id).eq('user_id', user.id).single();
    if (!bank) return jsonResponse(res, 400, { error: 'Bank account not found. Please bind one first.' });

    // Balance
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', user.id).single();
    if (!wallet || Number(wallet.balance) < amount) return jsonResponse(res, 400, { error: 'Insufficient balance' });

    const fee = amount * feePct / 100;
    const net = amount - fee;

    // Deduct gross immediately (locks funds)
    await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) - amount }).eq('user_id', user.id);

    // Withdrawal record (negative net)
    const { data: wTx, error: wErr } = await supabaseAdmin.from('transactions').insert({
      user_id: user.id, type: 'withdrawal', amount: -net, status: 'pending',
      description: `${bank.bank_name} • ${bank.account_number} • ${bank.account_name}`
    }).select().single();
    if (wErr) throw wErr;

    // Fee record
    if (fee > 0) {
      await supabaseAdmin.from('transactions').insert({
        user_id: user.id, type: 'withdrawal_fee', amount: -fee, status: 'completed',
        reference: wTx.id, description: 'Withdrawal processing fee'
      });
    }

    return jsonResponse(res, 200, { success: true });
  } catch (e) {
    console.error('WITHDRAW ERROR:', e);
    return jsonResponse(res, 500, { error: e.message });
  }
}
