// Only the anon/publishable key goes here. NEVER the service_role key.
window.CONFIG = {
    // Project URL (https://<project-ref>.supabase.co) - NOT the API/publishable key.
    SUPABASE_URL: 'https://boopynysjjeefbimmdqp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3B5bnlzamplZWZiaW1tZHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzODExNzcsImV4cCI6MjEwODk1NzE3N30.lq_UpBCtRQlLIL4zkVT04WOTEc6iw7lWjm79BuJbsNo',
    OWNER_EMAIL: 'uvertmarabe3@gmail.com', // fixed login identity; create this user in Supabase (see README)
    QUOTA_MB: 1024, // YOUR configured quota (not Supabase's account-wide limit; free plan = 1 GB total)
    MAX_FILE_MB: 10,
    MAX_VIDEO_MB: 500,
    PAGE_SIZE: 40
};
// Tolerate a pasted REST endpoint or trailing slash; the client needs the base URL.
window.CONFIG.SUPABASE_URL = String(window.CONFIG.SUPABASE_URL).replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');