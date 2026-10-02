let ventes = [];
let venteSelectionnee = null;

async function chargerVentes() {
    const tbody = document.getElementById("liste-ventes");

    try {
        const response = await fetch("/api/ventes");
        if (!response.ok) throw new Error("Erreur API");

        ventes = await response.json();

        if (ventes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty">Aucune vente</td></tr>`;
            return;
        }

        tbody.innerHTML = ventes.map(v => {
            const date = new Date(v.date).toLocaleString("fr-FR");
            const nbArticles = v.lignes.reduce((s, l) => s + l.quantite, 0);
            const nbPaiements = v.paiements.filter(p => p.type === "paiement").length;

            return `
                <tr class="clickable" data-id="${v.id}">
                    <td>${date}</td>
                    <td><strong>${v.total} F</strong></td>
                    <td>${nbArticles}</td>
                    <td>${nbPaiements}</td>
                </tr>
            `;
        }).join("");

        // Clic sur une ligne
        document.querySelectorAll("#liste-ventes tr.clickable").forEach(tr => {
            tr.addEventListener("click", () => {
                const id = Number(tr.dataset.id);
                selectionnerVente(id);

                // Style sélection
                document.querySelectorAll("#liste-ventes tr").forEach(r => r.classList.remove("selected"));
                tr.classList.add("selected");
            });
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty">Erreur de chargement</td></tr>`;
        console.error(err);
    }
}

function selectionnerVente(id) {
    venteSelectionnee = ventes.find(v => v.id === id);
    if (!venteSelectionnee) return;

    document.getElementById("detail-vide").style.display = "none";
    document.getElementById("detail-contenu").style.display = "block";

    document.getElementById("detail-date").textContent =
        new Date(venteSelectionnee.date).toLocaleString("fr-FR");
    document.getElementById("detail-total").textContent = venteSelectionnee.total + " F";

    // Lignes
    const tbodyLignes = document.getElementById("detail-lignes");
    tbodyLignes.innerHTML = venteSelectionnee.lignes.map(l => `
        <tr>
            <td>${l.produitNom}</td>
            <td>${l.quantite}</td>
            <td>${l.prixUnitaire} F</td>
            <td><strong>${l.quantite * l.prixUnitaire} F</strong></td>
        </tr>
    `).join("");

    // Paiements
    const tbodyPaiements = document.getElementById("detail-paiements");
    tbodyPaiements.innerHTML = venteSelectionnee.paiements.map(p => `
        <tr>
            <td>${p.type}</td>
            <td>${p.moyenPaiement}</td>
            <td>${p.montant} F</td>
        </tr>
    `).join("");
}

// Init
chargerVentes();