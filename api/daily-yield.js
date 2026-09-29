import { supabaseAdmin, jsonResponse } from './_utils.js';

export default async function handler(req, res) {
  try {
    const { error } = await supabaseAdmin.rpc('process_daily_yield');
    if (error) return jsonResponse(res, 500, { error: error.message });
    return jsonResponse(res, 200, { success: true, message: 'Daily yield processed' });
  } catch (e) {
    return jsonResponse(res, 500, { error: e.message });
  }
}
