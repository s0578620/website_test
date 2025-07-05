import { supabase } from './config.js';

document.getElementById('register-btn')?.addEventListener('click', async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Bitte E-Mail und Passwort eingeben.");
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            document.getElementById("register-error").innerText = `❌ ${error.message}`;
            document.getElementById("register-error").style.display = "block";
            document.getElementById("register-success").style.display = "none";
        } else {
            document.getElementById("register-success").innerText = "✅ Registrierung erfolgreich! Bitte E-Mail bestätigen.";
            document.getElementById("register-success").style.display = "block";
            document.getElementById("register-error").style.display = "none";

            // Optional: Weiterleitung nach kurzer Wartezeit
            setTimeout(() => location.href = "login.html", 3000);
        }
    } catch (err) {
        console.error("❌ Registrierung fehlgeschlagen:", err);
        document.getElementById("register-error").innerText = "❌ Unerwarteter Fehler. Bitte erneut versuchen.";
        document.getElementById("register-error").style.display = "block";
        document.getElementById("register-success").style.display = "none";
    }
});
