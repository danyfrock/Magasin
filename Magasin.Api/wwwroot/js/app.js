// --- État global du panier et des paiements ---
let panier = [];
let paiements = [];

// Sélection des éléments DOM récurrents
const montantPayeInput = document.getElementById("montantPaye");
const listePaiements = document.getElementById("paiements-effectues");
const btnValider = document.getElementById("validerVente");
const montantRenduInput = document.getElementById("montantRendu");
const inputScan = document.getElementById("scan");

// --- Calculs ---
function calculerTotalNumerique() {
    return panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
}

function totalPaye() {
    return paiements.reduce((sum, p) => sum + p.montant, 0);
}

function calculerTotal() {
    const total = calculerTotalNumerique();
    document.getElementById("total").textContent = total + " F";
}

// --- Affichages et Interface ---
function mettreAJourAffichagePaiement() {
    const total = calculerTotalNumerique();
    const paye = totalPaye();
    const reste = Math.max(0, total - paye);
    const aRendre = Math.max(0, paye - total);

    calculerTotal();
    document.getElementById("dejaPaye").textContent = paye + " F";
    document.getElementById("resteAPayer").textContent = reste + " F";
    document.getElementById("resteAPayer").style.color = reste === 0 ? "green" : "orange";

    const ligne = document.getElementById("ligneARendre");
    if (aRendre > 0) {
        document.getElementById("aRendre").textContent = aRendre + " F";
        ligne.style.display = "block";
    } else {
        ligne.style.display = "none";
    }

    // Optimisation : génération du HTML en une seule passe
    listePaiements.innerHTML = paiements.length === 0
        ? "<em>Aucun paiement</em>"
        : paiements.map((p, i) => `
            <div>
                ${p.mode.toUpperCase()} : ${p.montant} F
                <button type="button" class="btn-supprimer-paiement" data-index="${i}">✕</button>
            </div>
        `).join("");

    // Attachement propre des écouteurs sur les boutons de suppression de paiement
    document.querySelectorAll(".btn-supprimer-paiement").forEach(btn => {
        btn.addEventListener("click", () => {
            supprimerPaiement(Number(btn.dataset.index));
        });
    });

    btnValider.disabled = !(panier.length > 0 && reste === 0);
}

function afficherPanier() {
    const tbody = document.getElementById("panier");

    // Optimisation : génération du tableau en une seule fois
    tbody.innerHTML = panier.map(produit => `
        <tr>
            <td>${produit.nom}</td>
            <td>${produit.prix} F</td>
            <td>
                <span id="quantite-${produit.id}">${produit.quantite}</span>
                <button data-id="${produit.id}" data-action="plus">+</button>
                <button data-id="${produit.id}" data-action="moins">-</button>
                <button data-id="${produit.id}" data-action="supprimer">Supprimer</button>
            </td>
        </tr>
    `).join("");

    mettreAJourAffichagePaiement();
}

// --- Actions Panier & Code-barres ---
async function ajouterParCodeBarre(code) {
    try {
        const produit = await apiCall(`/api/produits/${code}`);
        if (!produit) {
            alert("Produit inconnu");
            return;
        }

        const existant = panier.find(p => p.id === produit.id);
        if (existant) {
            existant.quantite++;
        } else {
            panier.push({ ...produit, quantite: 1 });
        }

        afficherPanier();
    } catch (error) {
        alert("Produit inconnu ou erreur serveur");
    }
}

// --- Gestion des paiements ---
function ajouterPaiement(mode) {
    let montant = Number(montantPayeInput.value);

    if (!montant) {
        montant = Math.max(0, calculerTotalNumerique() - totalPaye());
    }

    paiements.push({ mode, montant });
    montantPayeInput.value = "";
    mettreAJourAffichagePaiement();
    montantPayeInput.focus();
}

function supprimerPaiement(index) {
    paiements.splice(index, 1);
    mettreAJourAffichagePaiement();
}

// --- Validation / Annulation ---
async function validerVente() {
    const total = calculerTotalNumerique();
    const paye = totalPaye();
    const rendu = Number(montantRenduInput.value) || 0;

    if (panier.length === 0) return alert("Panier vide");
    if (paye < total) return alert(`Il reste ${total - paye} F`);

    try {
        await apiCall("/api/ventes", {
            method: "POST",
            body: JSON.stringify({
                lignes: panier.map(p => ({ produitId: p.id, quantite: p.quantite })),
                paiements: paiements.map(p => ({ moyenPaiement: p.mode, montant: p.montant })),
                rendu: rendu
            })
        });

        let msg = `Vente validée\nTotal : ${total} F\n`;
        paiements.forEach(p => msg += `• ${p.mode.toUpperCase()} : ${p.montant} F\n`);
        if (rendu > 0) msg += `À rendre : ${rendu} F`;

        alert(msg);
        reinitialiserCaisse();
    } catch (error) {
        alert("Erreur lors de la validation de la vente.");
    }
}

function annulerVente() {
    if (panier.length === 0 && paiements.length === 0) return;
    if (confirm("Annuler la vente ?")) reinitialiserCaisse();
}

function reinitialiserCaisse() {
    panier = [];
    paiements = [];
    afficherPanier();
    montantPayeInput.value = "";
    montantRenduInput.value = "";
    mettreAJourAffichagePaiement();
    inputScan.focus();
}

// --- Événements ---
document.getElementById("payerEspeces").onclick = () => ajouterPaiement("especes");
document.getElementById("payerCarte").onclick = () => ajouterPaiement("carte");
document.getElementById("payerAirtel").onclick = () => ajouterPaiement("airtel");
document.getElementById("payerMoov").onclick = () => ajouterPaiement("moov");

document.getElementById("validerVente").onclick = validerVente;
document.getElementById("annulerVente").onclick = annulerVente;

inputScan.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        const code = inputScan.value.trim();
        if (code) {
            ajouterParCodeBarre(code);
            inputScan.value = "";
        }
    }
});

montantPayeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") ajouterPaiement("especes");
});

// Init
afficherPanier();