// GJob.in - Admin Image Upload (placeholder)

import { json } from '../../utils/response';

export async function onRequest(context) {
  return json({ success: true, message: 'Upload endpoint ready' });
}