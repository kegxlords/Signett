import { supabaseAdmin, jsonResponse } from './_utils.js';
import { getAuthenticatedUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getAuthenticatedUser(req);
    const { envelope_id } = req.body;

    const { data: env } = await supabaseAdmin.from('red_envelopes').select('*').eq('id', envelope_id).single();
    if (!env || !env.is_active) return jsonResponse(res, 404, { error: 'Red envelope not found' });
    if (new Date(env.starts_at) > new Date()) return jsonResponse(res, 400, { error: 'Not started yet' });
    if (env.expires_at && new Date(env.expires_at) < new Date()) return jsonResponse(res, 400, { error: 'Red envelope expired' });
    if (env.claims_count >= env.max_claims) return jsonResponse(res, 400, { error: 'All envelopes claimed' });

    const { data: claimed } = await supabaseAdmin.from('red_envelope_claims')
      .select('id').eq('red_envelope_id', env.id).eq('user_id', user.id).single();
    if (claimed) return jsonResponse(res, 400, { error: 'You already opened this envelope' });

    const amount = Number(env.claim_amount);
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', user.id).single();

    await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + amount }).eq('user_id', user.id);
    await supabaseAdmin.from('red_envelope_claims').insert({ red_envelope_id: env.id, user_id: user.id, amount });
    await supabaseAdmin.from('red_envelopes').update({ claims_count: env.claims_count + 1 }).eq('id', env.id);
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id, type: 'red_envelope', amount, status: 'completed',
      reference: env.id, description: `Red envelope: ${env.title}`
    });

    return jsonResponse(res, 200, { success: true, amount });
  } catch (e) {
    console.error('ENVELOPE ERROR:', e);
    return jsonResponse(res, 500, { error: e.message });
  }
}
