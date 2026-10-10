document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation du tableau Tabulator (aux normes de ton fichier grille.css)
    const table = new Tabulator("#users-table", {
        layout: "fitColumns",
        placeholder: "Chargement des utilisateurs...",
        ajaxURL: "/api/users",
        ajaxConfig: {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        },
        columns: [
            { formatter: "rownum", width: 60, hozAlign: "center", headerSort: false },
            { title: "Nom d'utilisateur", field: "username", width: 250 },
            { title: "Rôle", field: "role", width: 180 },
            { 
                title: "Doit changer mdp", 
                field: "doitChangerMotDePasse", 
                formatter: "tickCross", 
                hozAlign: "center", 
                width: 160 
            },
            {
                title: "Actions",
                field: "id",
                formatter: (cell) => {
                    const id = cell.getValue();
                    return `<button class="action-btn btn-supprimer delete-btn" data-id="${id}">Supprimer</button>`;
                },
                hozAlign: "center",
                headerSort: false,
                cellClick: async (e, cell) => {
                    if (e.target.classList.contains('delete-btn')) {
                        const userId = e.target.getAttribute('data-id');
                        if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
                            await supprimerUtilisateur(userId, table);
                        }
                    }
                }
            }
        ],
    });

    // 2. Gestion de la soumission du formulaire de création
    const form = document.getElementById('create-user-form');
    const errorDiv = document.getElementById('create-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.textContent = "";

        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });

            if (response.ok) {
                form.reset();
                table.setData(); // Actualisation du tableau Tabulator
                alert("Utilisateur créé avec succès !");
            } else {
                const err = await response.json();
                errorDiv.textContent = err.message || "Erreur lors de la création.";
            }
        } catch (ex) {
            console.error(ex);
            errorDiv.textContent = "Erreur technique de communication avec le serveur.";
        }
    });
});

// Fonction de suppression
async function supprimerUtilisateur(id, table) {
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            table.deleteRow(id);
        } else {
            const err = await response.json();
            alert(err.message || "Impossible de supprimer l'utilisateur.");
        }
    } catch (ex) {
        console.error(ex);
        alert("Erreur technique lors de la suppression.");
    }
}