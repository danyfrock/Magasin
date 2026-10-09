(function() {
    // 1. Interception globale de fetch (détecte le 401 Unauthorized)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        
        // Si l'API renvoie 401 et qu'on n'est pas déjà sur la page de login
        if (response.status === 401 && !window.location.pathname.includes('login.html')) {
            window.location.href = '/pages/login.html';
            throw new Error("Session expirée ou non authentifié.");
        }
        return response;
    };

    // 2. Vérification au chargement de la page (sauf si on est déjà sur login.html)
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('login.html')) {
            initialiserPageLogin(originalFetch);
            return;
        }

        // Vérifier si l'utilisateur est authentifié sur les autres pages
        originalFetch('/api/auth/me')
            .then(res => {
                if (!res.ok) {
                    window.location.href = '/pages/login.html';
                }
            })
            .catch(() => {
                window.location.href = '/pages/login.html';
            });
    });

    // 3. Logique spécifique à la page login.html
    function initialiserPageLogin(fetchFn) {
        const loginForm = document.getElementById('login-form');
        const passwordForm = document.getElementById('password-form');
        const loginCard = document.getElementById('login-card');
        const passwordCard = document.getElementById('password-card');

        // Soumission du formulaire de connexion
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                const errorDiv = document.getElementById('login-error');
                errorDiv.textContent = '';

                try {
                    const response = await fetchFn('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.doitChangerMotDePasse) {
                            if (loginCard) loginCard.style.display = 'none';
                            if (passwordCard) passwordCard.style.display = 'block';
                        } else {
                            // Redirection vers le menu principal à la racine
                            window.location.href = '/index.html';
                        }
                    } else {
                        const err = await response.json();
                        errorDiv.textContent = err.message || "Identifiants incorrects.";
                    }
                } catch (ex) {
                    errorDiv.textContent = "Erreur de connexion au serveur.";
                }
            });
        }

        // Soumission du changement de mot de passe obligatoire
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const oldPassword = document.getElementById('old-password').value;
                const newPassword = document.getElementById('new-password').value;
                const errorDiv = document.getElementById('password-error');
                errorDiv.textContent = '';

                try {
                    const response = await fetchFn('/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldPassword, newPassword })
                    });

                    if (response.ok) {
                        alert("Mot de passe mis à jour avec succès ! Veuillez vous reconnecter.");
                        window.location.href = '/pages/login.html';
                    } else {
                        const err = await response.json();
                        errorDiv.textContent = err.message || "Erreur lors du changement.";
                    }
                } catch (ex) {
                    errorDiv.textContent = "Erreur technique.";
                }
            });
        }
    }
})();