import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY || ''
  },
  backblaze: {
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
    applicationKey: process.env.B2_APPLICATION_KEY || '',
    bucketId: process.env.B2_BUCKET_ID || ''
  }
};
