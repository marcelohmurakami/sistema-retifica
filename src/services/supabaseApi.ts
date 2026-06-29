import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://mmimlaxiujbkvxosrirt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1taW1sYXhpdWpia3Z4b3NyaXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDUyMDAsImV4cCI6MjA4NzYyMTIwMH0.iEnnWdzN7ipZoegpFRnx1sGnsKUsvcNSwjvW4JWoiLw'
export const supabase = createClient(supabaseUrl, supabaseKey)

