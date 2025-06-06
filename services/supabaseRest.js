// services/supabaseRest.js
import axios from 'axios';

const SUPABASE_URL = 'https://rgpsvydcojbhnevmkvak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncHN2eWRjb2piaG5ldm1rdmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODIyNDksImV4cCI6MjA2MzI1ODI0OX0.lQuPZvJKyFXw5oXUIterWcSqcaRsFABmomErgnIaVdg';

const supabaseRest = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1/`,
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Fetch single profile by id
export const fetchProfileById = async (id) => {
  try {
    const response = await supabaseRest.get('linkme_profiles', {
      params: {
        id: `eq.${id}`,
        select: '*',
        limit: 1,
      },
    });
    // Supabase REST returns array of results
    return response.data[0] || null;
  } catch (error) {
    throw error;
  }
};
