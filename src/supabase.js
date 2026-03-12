import { createClient } from '@supabase/supabase-js';

// Replace these with the actual URL and Key from your Supabase dashboard
const supabaseUrl = 'https://amyjzxwbcsklrtypkmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteWp6eHdiY3NrbHJ0eXBrbXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjU0ODksImV4cCI6MjA4ODkwMTQ4OX0.6PPllfJVegloASKK_KsCpvMJ8eUwdi0bjb9TlrsXJR8';

export const supabase = createClient(supabaseUrl, supabaseKey);