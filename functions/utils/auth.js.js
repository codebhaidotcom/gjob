// GJob.in - Auth Helper

export async function verifyAdmin(request, env) {
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) return false;
  const encoder = new TextEncoder();
  const a = encoder.encode(auth);
  const b = encoder.encode(env.ADMIN_KEY);
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}