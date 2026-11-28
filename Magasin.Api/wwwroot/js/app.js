import { createProductPicker } from "./product-picker.js";

// --- État global ---
let panier = [];
let paiements = [];
let deviseCaisse = "XOF"; // sera mis à jour au démarrage

// Éléments DOM
const montantPayeInput = document.getElementById("montantPaye");
const listePaiements = document.getElementById("paiements-effectues");
const btnValider = document.getElementById("validerVente");
const montantRenduInput = document.getElementById("montantRendu");
const inputScan = document.getElementById("scan");
const btnRechercherProduit = document.getElementById("btnRechercherProduit");
const modalAutreDevise = document.getElementById("modalAutreDevise");
const converterModal = document.getElementById("converterModal");

const productPicker = createProductPicker({
  mode: "modal", // ou "drawer"
  htmlUrl: "../components/product-picker.html"
});

// --- Utilitaires ---
function formatMontant(montant) {
  return `${montant} ${deviseCaisse}`;
}

function calculerTotalNumerique() {
  return panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
}

function totalPaye() {
  return paiements.reduce((sum, p) => sum + p.montant, 0);
}

function calculerTotal() {
  document.getElementById("total").textContent = formatMontant(calculerTotalNumerique());
}

function construireVenteDto(estFinalisee) {
  const rendu = Number(montantRenduInput?.value) || 0;

  return {
    lignes: panier.map(p => ({ produitId: p.id, quantite: p.quantite })),
    paiements: paiements.map(p => ({
      moyenPaiement: p.mode,
      montant: p.montant,
      devise: p.devise || deviseCaisse,
      montantOriginal: p.montantOriginal ?? p.montant
    })),
    rendu,
    deviseCaisse,
    estFinalisee
  };
}

function synchroniserVentePotCommun() {
  if (!window.potCommun) return;

  if (panier.length === 0) {
    window.potCommun.chargerVente(null);
    return;
  }

  const total = calculerTotalNumerique();
  window.potCommun.chargerVente(construireVenteDto(false), {
    openDrawer: false,
    label: `Joint au message : Vente en cours (${formatMontant(total)})`
  });
}

// --- Reprise depuis Pot commun ---
async function reprendreDepuisPotCommun(detail = {}) {
  const { produitId, venteId } = detail;

  if (produitId) {
    try {
      const produit = await apiCall(`/api/produits/${produitId}`);
      if (!produit) {
        alert("Produit introuvable");
        return;
      }

      if (produit.codeBarre) {
        selectionnerCodeBarreDansScan(produit.codeBarre);
      } else {
        const existant = panier.find(p => p.id === produit.id);
        if (existant) {
          existant.quantite++;
        } else {
          panier.push({ ...produit, quantite: 1 });
        }
        afficherPanier();
      }
    } catch {
      alert("Impossible de reprendre le produit.");
    }
    return;
  }

  if (venteId) {
    try {
      const vente = await apiCall(`/api/ventes/${venteId}`);
      if (!vente) {
        alert("Vente introuvable");
        return;
      }

      const lignesSource = vente.lignes ?? [];
      panier = lignesSource.map(l => ({
        id: l.produitId,
        nom: l.produitNom ?? `Produit #${l.produitId}`,
        prix: Number(l.prixUnitaire ?? l.prix ?? 0),
        quantite: Number(l.quantite ?? 1),
        codeBarre: l.codeBarre
      }));

      const paiementsSource = vente.paiements ?? [];
      paiements = paiementsSource.map(p => ({
        mode: p.moyenPaiement ?? p.mode ?? "especes",
        montant: Number(p.montant ?? 0),
        devise: p.devise || deviseCaisse,
        montantOriginal: Number(p.montantOriginal ?? p.montant ?? 0)
      }));

      if (montantRenduInput) {
        montantRenduInput.value = vente.rendu ? String(vente.rendu) : "";
      }

      afficherPanier();
    } catch {
      alert("Impossible de reprendre la vente.");
    }
  }
}

// --- Affichage ---
function mettreAJourAffichagePaiement() {
  const total = calculerTotalNumerique();
  const paye = totalPaye();
  const reste = Math.max(0, total - paye);
  const aRendre = Math.max(0, paye - total);

  calculerTotal();
  document.getElementById("dejaPaye").textContent = formatMontant(paye);
  document.getElementById("resteAPayer").textContent = formatMontant(reste);
  document.getElementById("resteAPayer").style.color = reste === 0 ? "green" : "orange";

  const ligne = document.getElementById("ligneARendre");
  if (aRendre > 0) {
    document.getElementById("aRendre").textContent = formatMontant(aRendre);
    ligne.style.display = "block";
  } else {
    ligne.style.display = "none";
  }

  // Liste des paiements
  listePaiements.innerHTML = paiements.length === 0
    ? "<em>Aucun paiement</em>"
    : paiements.map((p, i) => {
        const label = p.devise && p.devise !== deviseCaisse
          ? `${p.mode.toUpperCase()} : ${formatMontant(p.montant)} (${p.montantOriginal} ${p.devise})`
          : `${p.mode.toUpperCase()} : ${formatMontant(p.montant)}`;
        return `
          <div>
            ${label}
            <button type="button" class="btn-supprimer-paiement" data-index="${i}">✕</button>
          </div>`;
      }).join("");

  document.querySelectorAll(".btn-supprimer-paiement").forEach(btn => {
    btn.addEventListener("click", () => {
      supprimerPaiement(Number(btn.dataset.index));
    });
  });

  btnValider.disabled = !(panier.length > 0 && reste === 0);
  synchroniserVentePotCommun();
}

function afficherPanier() {
  const tbody = document.getElementById("panier");
  tbody.innerHTML = panier.map(produit => `
    <tr>
      <td>${produit.nom}</td>
      <td>${formatMontant(produit.prix)}</td>
      <td>
        <span>${produit.quantite}</span>
        <button type="button" class="btn-qty" data-id="${produit.id}" data-action="plus">+</button>
        <button type="button" class="btn-qty" data-id="${produit.id}" data-action="moins">-</button>
        <button type="button" class="btn-supprimer" data-id="${produit.id}" data-action="supprimer">Supprimer</button>
      </td>
    </tr>
  `).join("");

  mettreAJourAffichagePaiement();
}

// --- Panier ---
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
  } catch {
    alert("Produit inconnu ou erreur serveur");
  }
}

function selectionnerCodeBarreDansScan(codeBarre) {
  if (!codeBarre || !inputScan) return;

  inputScan.value = codeBarre;
  inputScan.focus();
  inputScan.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true
  }));
}

// --- Paiements classiques (devise caisse) ---
function ajouterPaiement(mode) {
  let montant = Number(montantPayeInput.value);

  if (!montant || montant <= 0) {
    montant = Math.max(0, calculerTotalNumerique() - totalPaye());
  }

  if (montant <= 0) return;

  paiements.push({
    mode,
    montant,
    devise: deviseCaisse,
    montantOriginal: montant
  });

  montantPayeInput.value = "";
  mettreAJourAffichagePaiement();
  montantPayeInput.focus();
}

function supprimerPaiement(index) {
  paiements.splice(index, 1);
  mettreAJourAffichagePaiement();
}

// --- Modal autre devise ---
document.getElementById("payerAutreDevise").addEventListener("click", () => {
  converterModal?.reset();
  modalAutreDevise.showModal();
});

document.getElementById("annulerPaiementDevise").addEventListener("click", () => {
  modalAutreDevise.close();
  converterModal?.reset();
});

document.getElementById("validerPaiementDevise").addEventListener("click", () => {
  const conv = converterModal?.getLastConversion();

  if (!conv || !conv.montant || conv.montant <= 0) {
    alert("Conversion non disponible ou montant invalide");
    return;
  }

  paiements.push({
    mode: "especes",
    montant: conv.montant,                 // déjà en devise caisse
    devise: conv.devise,                   // devise d'origine
    montantOriginal: conv.montantOriginal
  });

  mettreAJourAffichagePaiement();
  modalAutreDevise.close();
  converterModal?.reset();
});

// Fermer la modal avec Échap ou clic extérieur
modalAutreDevise.addEventListener("close", () => {
  converterModal?.reset();
});

// --- Validation / Annulation ---
async function validerVente() {
  const total = calculerTotalNumerique();
  const paye = totalPaye();
  const rendu = Number(montantRenduInput.value) || 0;

  if (panier.length === 0) return alert("Panier vide");
  if (paye < total) return alert(`Il reste ${formatMontant(total - paye)}`);

  try {
    await apiCall("/api/ventes", {
      method: "POST",
      body: JSON.stringify(construireVenteDto(true))
    });

    if (document.getElementById("imprimerTicketAuto")?.checked) {
      imprimerTicketCaisse({
        date: new Date(),
        lignes: panier.map(p => ({
          produitNom: p.nom,
          quantite: p.quantite,
          prixUnitaire: p.prix
        })),
        paiements: paiements,
        rendu: rendu
      });
    }

    let msg = `Vente validée\nTotal : ${formatMontant(total)}\n`;
    paiements.forEach(p => {
      msg += p.devise && p.devise !== deviseCaisse
        ? `• ${p.mode.toUpperCase()} : ${formatMontant(p.montant)} (${p.montantOriginal} ${p.devise})\n`
        : `• ${p.mode.toUpperCase()} : ${formatMontant(p.montant)}\n`;
    });
    if (rendu > 0) msg += `À rendre : ${formatMontant(rendu)}`;

    alert(msg);
    reinitialiserCaisse();
  } catch {
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
  window.potCommun?.clear();
  inputScan.focus();
}

// --- Chargement de la devise de caisse ---
async function chargerDeviseCaisse() {
  try {
    const response = await fetch("/api/caisse/devise");
    if (!response.ok) throw new Error();
    const data = await response.json();
    deviseCaisse = data.deviseCaisse || data.DeviseCaisse || "XOF";
  } catch {
    deviseCaisse = "XOF";
  }

  // Synchronise aussi le convertisseur
  if (converterModal) {
    converterModal.defaultCurrency = deviseCaisse;
  }
}

// --- Événements ---
document.getElementById("payerEspeces").onclick = () => ajouterPaiement("especes");
document.getElementById("payerCarte").onclick = () => ajouterPaiement("carte");
document.getElementById("payerAirtel").onclick = () => ajouterPaiement("airtel");
document.getElementById("payerMoov").onclick = () => ajouterPaiement("moov");

document.getElementById("validerVente").onclick = validerVente;
document.getElementById("annulerVente").onclick = annulerVente;

document.getElementById("panier").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const produit = panier.find(p => p.id === id);
  if (!produit) return;

  if (action === "plus") produit.quantite++;
  else if (action === "moins") produit.quantite--;
  else if (action === "supprimer") panier = panier.filter(p => p.id !== id);

  afficherPanier();
});

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

btnRechercherProduit?.addEventListener("click", () => {
  productPicker.open({
    initialText: inputScan?.value.trim() ?? "",
    onSelect: selectionnerCodeBarreDansScan
  });
});

document.addEventListener("pot-commun:reprendre", (event) => {
  reprendreDepuisPotCommun(event.detail);
});

// Init
chargerDeviseCaisse().then(() => {
  afficherPanier();
});