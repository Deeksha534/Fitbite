import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🚨 IMPORTANT: REPLACE WITH YOUR ACTUAL KEYS 🚨
const supabaseUrl = 'https://vlshgyqlptiihqmdbkzr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc2hneXFscHRpaWhxbWRia3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzUyMDIsImV4cCI6MjA3OTA1MTIwMn0.UTrtpbjYFT7P3iHilPvdOAjW7ozSTSQIYoXq01wic8A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)