import { supabase } from './config.js';

document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        document.getElementById("login-error").style.display = "block";
        console.error("Login error:", error.message);
    } else {
        location.href = "admin.html";
    }
});
