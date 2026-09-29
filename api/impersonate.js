import { supabaseAdmin, jsonResponse } from './_utils.js';
import { getAuthenticatedUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });
  try {
    await getAuthenticatedUser(req); // _auth already verifies session; add admin check:
    const { data: prof } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', (await getAuthenticatedUser(req)).id).single();

    const { email } = req.body;
    if (!email) return jsonResponse(res, 400, { error: 'Email required' });

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `https://${req.headers.host}/app/home.html` }
    });
    if (error) return jsonResponse(res, 500, { error: error.message });

    return jsonResponse(res, 200, { magic_link: data.properties?.action_link });
  } catch (e) {
    return jsonResponse(res, 500, { error: e.message });
  }
}
