// Le panier du client
let panier = [];

function calculerTotal() {
    let total = 0;
    panier.forEach(p => total += p.prix * p.quantite);
    document.getElementById("total").textContent = total + " F";
}

async function ajouterParCodeBarre(code) {
     const response = await fetch(`/api/produits/${code}`);
    if (!response.ok) {
        alert("Produit inconnu");
        return;
    }
    const produit = await response.json();

    if (!produit) {
        alert("Produit inconnu");
        return;
    }

    const existant = panier.find(p => p.id === produit.id);

    if (existant) {
        existant.quantite++;
    } else {
        panier.push({
            ...produit,   // copie id, codeBarre, nom, prix
            quantite: 1
        });
    }

    afficherPanier();
    calculerTotal();
}

function afficherPanier() {
    const tbody = document.getElementById("panier");
    tbody.innerHTML = "";

    panier.forEach(produit => {
        tbody.innerHTML += `
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
        `;
    });

    // Ré-attache les boutons
    document.querySelectorAll("button[data-id]").forEach(bouton => {
        bouton.addEventListener("click", () => {
            const id = Number(bouton.dataset.id);
            const action = bouton.dataset.action;
            const produit = panier.find(p => p.id === id);

            if (!produit) return;

            if (action === "plus") {
                produit.quantite++;
            } 
            else if (action === "moins") {
                 produit.quantite--;
            } 
            else if (action === "supprimer") {
                panier = panier.filter(p => p.id !== id);
                afficherPanier();
                calculerTotal();
                return;
            }

            document.getElementById("quantite-" + id).textContent = produit.quantite;
            calculerTotal();
        });
    });
}

// === Gestion du scan / recherche ===
const inputScan = document.getElementById("scan");

inputScan.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const code = inputScan.value.trim();
        if (code) {
            ajouterParCodeBarre(code);
            inputScan.value = ""; // on vide pour le prochain scan
        }
    }
});

// Initialisation
afficherPanier();
calculerTotal();

// ============================================================
// ÉTAT DU PAIEMENT
// ============================================================

let paiements = [];

const montantPayeInput = document.getElementById("montantPaye");
const listePaiements   = document.getElementById("paiements-effectues");
const btnValider       = document.getElementById("validerVente");
const montantRenduInput = document.getElementById("montantRendu");

// ============================================================
// CALCULS SIMPLES
// ============================================================
function calculerTotalNumerique() {
    return panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
}

function totalPaye() {
    return paiements.reduce((sum, p) => sum + p.montant, 0);
}

function mettreAJourAffichagePaiement() {
    const total = calculerTotalNumerique();
    const paye  = totalPaye();
    const reste = Math.max(0, total - paye);
    const aRendre = Math.max(0, paye - total);
    const rendu = Number(montantRenduInput.value) || 0;

    // Affichages
    document.getElementById("total").textContent = total + " F";
    document.getElementById("dejaPaye").textContent = paye + " F";
    document.getElementById("resteAPayer").textContent = reste + " F";
    document.getElementById("resteAPayer").style.color = reste === 0 ? "green" : "orange";

    // À rendre (uniquement si trop payé)
    const ligne = document.getElementById("ligneARendre");
    if (aRendre > 0) {
        document.getElementById("aRendre").textContent = aRendre + " F";
        ligne.style.display = "block";
    } else {
        ligne.style.display = "none";
    }

    // Liste des paiements
    listePaiements.innerHTML = paiements.length === 0
        ? "<em>Aucun paiement</em>"
        : paiements.map((p, i) => `
            <div>
                ${p.mode.toUpperCase()} : ${p.montant} F
                <button type="button" onclick="supprimerPaiement(${i})">✕</button>
            </div>
          `).join("");

    // Valider seulement si panier non vide ET tout est payé
    btnValider.disabled = !(panier.length > 0 && reste === 0);
}

function supprimerPaiement(index) {
    paiements.splice(index, 1);
    mettreAJourAffichagePaiement();
}

// ============================================================
// AJOUTER UN PAIEMENT (version libre)
// ============================================================
function ajouterPaiement(mode) {
    let montant = Number(montantPayeInput.value);

    // Si rien n’est saisi → on met le reste
    if (!montant) {
        montant = Math.max(0, calculerTotalNumerique() - totalPaye());
    }

    // On accepte le montant tel quel (même s’il dépasse)
    // La monnaie s’affichera automatiquement s’il y a un trop-perçu
    paiements.push({ mode, montant });
    montantPayeInput.value = "";
    mettreAJourAffichagePaiement();
    montantPayeInput.focus();
}

// ============================================================
// VALIDER / ANNULER
// ============================================================
async  function validerVente() {
    const total = calculerTotalNumerique();
    const paye  = totalPaye();

    if (panier.length === 0) return alert("Panier vide");
    if (paye < total) return alert(`Il reste ${total - paye} F`);

    const vente = {
        date: new Date().toISOString(),
        total,
        montantPaye: paye,
        monnaieRendue: paye > total ? paye - total : 0,
        paiements: [...paiements],
        articles: panier.map(p => ({
            id: p.id,
            nom: p.nom,
            prix: p.prix,
            quantite: p.quantite,
            sousTotal: p.prix * p.quantite
        }))
    };

    const response = await fetch("/api/ventes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            lignes: panier.map(p => ({
                produitId: p.id,
                quantite: p.quantite
            })),
            paiements: paiements.map(p => ({
                moyenPaiement: p.mode,
                montant: p.montant
            })),
            rendu: Number(montantRenduInput.value) || 0
        })
    });

    let msg = `Vente validée\nTotal : ${total} F\n`;
    paiements.forEach(p => msg += `• ${p.mode.toUpperCase()} : ${p.montant} F\n`);
    if (vente.monnaieRendue > 0) msg += `À rendre : ${vente.monnaieRendue} F`;

    alert(msg);
    reinitialiserCaisse();
}

function annulerVente() {
    if (panier.length === 0 && paiements.length === 0) return;
    if (confirm("Annuler la vente ?")) reinitialiserCaisse();
}

function reinitialiserCaisse() {
    panier = [];
    paiements = [];
    afficherPanier();
    calculerTotal();
    montantPayeInput.value = "";
    montantRenduInput.value = "";
    mettreAJourAffichagePaiement();
    document.getElementById("scan").focus();
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================
document.getElementById("payerEspeces").onclick = () => ajouterPaiement("especes");
document.getElementById("payerCarte").onclick   = () => ajouterPaiement("carte");
document.getElementById("payerAirtel").onclick  = () => ajouterPaiement("airtel");
document.getElementById("payerMoov").onclick    = () => ajouterPaiement("moov");

document.getElementById("validerVente").onclick = validerVente;
document.getElementById("annulerVente").onclick = annulerVente;

montantPayeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") ajouterPaiement("especes");
});

// Quand le panier change, on met à jour l’affichage paiement
const _afficherPanier = afficherPanier;
afficherPanier = function () {
    _afficherPanier();
    mettreAJourAffichagePaiement();
};

// Init
mettreAJourAffichagePaiement();