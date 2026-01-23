// Authentication handler for login page
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import SUPABASE_CONFIG from './config.js';

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Check if already authenticated
const { data: { session } } = await supabase.auth.getSession();
if (session) {
    // Already logged in, redirect to plan page
    window.location.href = './index.html';
}

// Handle Google login
const googleLoginBtn = document.getElementById('google-login-btn');
const loginError = document.getElementById('login-error');
const loginLoading = document.getElementById('login-loading');

googleLoginBtn.addEventListener('click', async () => {
    try {
        loginLoading.style.display = 'block';
        loginError.style.display = 'none';
        googleLoginBtn.disabled = true;

        // Get the current directory path and replace login.html with index.html
        const currentUrl = window.location.href;
        const redirectUrl = currentUrl.replace('login.html', 'index.html');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });

        if (error) throw error;

        // OAuth will redirect automatically, so we don't need to do anything here
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.message || 'Failed to sign in. Please try again.';
        loginError.style.display = 'block';
        loginLoading.style.display = 'none';
        googleLoginBtn.disabled = false;
    }
});
