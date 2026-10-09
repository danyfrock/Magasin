// wwwroot/js/auth.js

(function() {
    // 1. Injection automatique des modales HTML dans la page
    function injectAuthModals() {
        if (document.getElementById('login-modal')) return;

        const modalHtml = `
        <!-- Modale de Connexion -->
        <div id="login-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center;">
            <div style="background:white; padding:30px; border-radius:8px; width:350px; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family:sans-serif;">
                <h2 style="margin-top:0; color:#333;">Connexion - Magasin</h2>
                <form id="login-form">
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight:bold; font-size:14px;">Nom d'utilisateur :</label><br>
                        <input type="text" id="login-username" value="admin" required style="width:100%; padding:8px; margin-top:5px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight:bold; font-size:14px;">Mot de passe :</label><br>
                        <input type="password" id="login-password" required style="width:100%; padding:8px; margin-top:5px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div id="login-error" style="color:red; margin-bottom:15px; font-size:14px;"></div>
                    <button type="submit" style="width:100%; padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Se connecter</button>
                </form>
            </div>
        </div>

        <!-- Modale de Changement de Mot de Passe -->
        <div id="password-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; justify-content:center; align-items:center;">
            <div style="background:white; padding:30px; border-radius:8px; width:350px; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family:sans-serif;">
                <h2 style="margin-top:0; color:#333;">Sécurité requise</h2>
                <p style="font-size:13px; color:#555; line-height:1.4;">C'est votre première connexion. Veuillez modifier votre mot de passe temporaire.</p>
                <form id="password-form">
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight:bold; font-size:14px;">Ancien mot de passe :</label><br>
                        <input type="password" id="old-password" required style="width:100%; padding:8px; margin-top:5px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight:bold; font-size:14px;">Nouveau mot de passe :</label><br>
                        <input type="password" id="new-password" required style="width:100%; padding:8px; margin-top:5px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div id="password-error" style="color:red; margin-bottom:15px; font-size:14px;"></div>
                    <button type="submit" style="width:100%; padding:10px; background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Mettre à jour</button>
                </form>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 2. Interception globale de fetch (détecte le 401 Unauthorized)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        if (response.status === 401) {
            afficherLoginModal();
            throw new Error("Session expirée ou non authentifié.");
        }
        return response;
    };

    function afficherLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex';
    }

    function cacherLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'none';
    }

    function afficherPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'flex';
    }

    function cacherPasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'none';
    }

    // 3. Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', () => {
        injectAuthModals();

        // Vérifier si l'utilisateur est déjà authentifié au chargement
        originalFetch('/api/auth/me')
            .then(res => {
                if (!res.ok) {
                    afficherLoginModal();
                }
            })
            .catch(() => afficherLoginModal());

        // Gestion globale des soumissions de formulaires d'authentification
        document.addEventListener('submit', async (e) => {
            // Soumission du Login
            if (e.target && e.target.id === 'login-form') {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                const errorDiv = document.getElementById('login-error');
                errorDiv.textContent = '';

                try {
                    const response = await originalFetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        cacherLoginModal();

                        if (data.doitChangerMotDePasse) {
                            afficherPasswordModal();
                        } else {
                            location.reload();
                        }
                    } else {
                        const err = await response.json();
                        errorDiv.textContent = err.message || "Identifiants incorrects.";
                    }
                } catch (ex) {
                    errorDiv.textContent = "Erreur de connexion au serveur.";
                }
            }

            // Soumission du Changement de Mot de Passe
            if (e.target && e.target.id === 'password-form') {
                e.preventDefault();
                const oldPassword = document.getElementById('old-password').value;
                const newPassword = document.getElementById('new-password').value;
                const errorDiv = document.getElementById('password-error');
                errorDiv.textContent = '';

                try {
                    const response = await originalFetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldPassword, newPassword })
                    });

                    if (response.ok) {
                        cacherPasswordModal();
                        alert("Mot de passe mis à jour avec succès !");
                        location.reload();
                    } else {
                        const err = await response.json();
                        errorDiv.textContent = err.message || "Erreur lors du changement.";
                    }
                } catch (ex) {
                    errorDiv.textContent = "Erreur technique.";
                }
            }
        });
    });
})();