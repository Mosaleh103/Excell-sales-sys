// ── SUPABASE CONNECTION ── (Load First)
const { createClient } = supabase;
const sb = createClient(
  'https://ttpfzvdhziikcimzgnnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cGZ6dmRoemlpa2NpbXpnbm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjcwNTIsImV4cCI6MjA5MDU0MzA1Mn0.AiZhKTxFcNif6QcW5pJd3TONo2hCQJbTsXB9aHmZohA'
);
