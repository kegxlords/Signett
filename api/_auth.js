import { supabaseAdmin } from './_utils.js';
export async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No authorization token provided');
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error('Invalid or expired session');
  return user;
}
