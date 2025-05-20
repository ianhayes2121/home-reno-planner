/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: https://riefbexhwazkcnlpxmyo.supabase.co
  readonly VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZWZiZXhod2F6a2NubHB4bXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTczNDIsImV4cCI6MjA2MzI3MzM0Mn0.b8jqy4Sz6WzpalFXO-DWIsXIQ_2OSHPYMpBdtjJcwNY
  // add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type for the `supabase` client
declare global {
  interface Window {
    // Add any global window properties here if needed
  }
}
