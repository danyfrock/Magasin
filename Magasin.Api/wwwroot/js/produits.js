// --- État global du module ---
let produitTable = null;
let imageSelectionnee = null;

document.addEventListener("DOMContentLoaded", () => {
    initialiserGrille();
    initialiserFormulaire();
    chargerProduits();
});

// --- Mutualisation : Gestion unifiée de l'aperçu image ---
function appliquerApercuImage(src, afficherTexteVide) {
    const container = document.getElementById("image-preview-container");
    const image = document.getElementById("image-preview");
    const texte = document.getElementById("image-preview-empty");

    if (afficherTexteVide) {
        container.classList.remove("visible");
        image.removeAttribute("src");
        texte.style.display = "block";
    } else {
        image.src = src;
        image.style.display = "block";
        texte.style.display = "none";
        container.classList.add("visible");
    }
    mettreAJourEtatBoutonIa();
}

// --- Mutualisation : Récupération du produit en cours d'édition ---
function getProduitExistantCourant() {
    const id = document.getElementById("produit-id").value;
    if (id === "") return null;
    const lignes = produitTable.getRows().map(row => row.getData());
    return lignes.find(p => p.id === Number(id)) || null;
}

// --- Grille (Tabulator) ---
function initialiserGrille() {
    produitTable = new Tabulator("#produit-table", {
        layout: "fitColumns",
        pagination: true,
        paginationSize: 15,
        paginationSizeSelector: [10, 15, 25, 50],
        placeholder: "Aucun produit",
        columns: [
            {
                title: "Image",
                field: "image",
                formatter: (cell) => {
                    const img = cell.getValue();
                    if (!img?.imageResponse) return "";
                    return `<img src="/${img.imageResponse.imagePath}" class="produit-image" alt="Produit">`;
                },
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Code-barres",
                field: "codeBarre",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Code-barres scannable",
                field: "scannableCodebarre",
                formatter: (cell) => {
                    const base64 = cell.getValue();
                    if (!base64) return "";
                    return `<img src="data:image/png;base64,${base64}" alt="Code-barres" style="height: 50px; max-width: 180px;">`;
                },
                hozAlign: "center",
                headerSort: false,
                width: 200
            },
            {
                title: "Nom",
                field: "nom",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Prix",
                field: "prix",
                headerFilter: "input",
                sorter: "number",
                hozAlign: "right"
            },
            {
                title: "Description",
                field: "description",
                headerFilter: "input",
                sorter: "string"
            },
            {
                title: "Actions",
                width: 220,
                formatter: () => `
                    <button class="action-btn btn-modifier">Modifier</button>
                    <button class="action-btn btn-supprimer">Supprimer</button>
                `,
                hozAlign: "center",
                headerSort: false,
                cellClick: (event, cell) => {
                    const produit = cell.getRow().getData();
                    const bouton = event.target;

                    if (bouton.classList.contains("btn-modifier")) {
                        chargerProduitDansFormulaire(produit);
                    }
                    if (bouton.classList.contains("btn-supprimer")) {
                        supprimerProduit(produit.id);
                    }
                }
            }
        ]
    });

    document.getElementById("btn-imprimer").addEventListener("click", () => window.print());
}

// --- Formulaire & Modale ---
function initialiserFormulaire() {
    const formulaire = document.getElementById("produit-form");
    const boutonAnnuler = document.getElementById("btn-annuler");
    const boutonAjouterImage = document.getElementById("btn-ajouter-image");
    const champImage = document.getElementById("image");
    const boutonAnalyserIa = document.getElementById("btn-analyser-ia");

    formulaire.addEventListener("submit", enregistrerProduit);
    boutonAnnuler.addEventListener("click", nettoyerFormulaire);
    boutonAjouterImage.addEventListener("click", () => champImage.click());
    champImage.addEventListener("change", afficherNouvelleImage);
    boutonAnalyserIa.addEventListener("click", analyserImageAvecIa);

    // Gestion de la modale d'images
    const boutonChoisirImage = document.getElementById("btn-choisir-image");
    const modalImages = document.getElementById("modal-images");
    const boutonFermerModal = document.getElementById("btn-fermer-modal");

    boutonChoisirImage.addEventListener("click", async () => {
        await chargerImages(modalImages);
    });

    boutonFermerModal.addEventListener("click", () => {
        modalImages.classList.remove("visible");
    });
}

// --- Gestion de l'état du bouton IA ---
function mettreAJourEtatBoutonIa() {
    const fichier = document.getElementById("image").files[0];
    const imagePreview = document.getElementById("image-preview");
    const aUneImage = fichier || imageSelectionnee || (imagePreview.getAttribute("src") && imagePreview.getAttribute("src") !== "");
    
    const boutonAnalyserIa = document.getElementById("btn-analyser-ia");
    boutonAnalyserIa.disabled = !aUneImage;
}

// --- Chargement des données ---
async function chargerImages(modalImages) {
    try {
        const images = await apiCall("/api/image");
        const liste = document.getElementById("liste-images");

        liste.innerHTML = images.map(image => {
            const nomFichier = image.imagePath.split("\\").pop();
            return `
                <div class="image-selection" data-image-id="${image.id}">
                    <img src="/Images/${nomFichier}" alt="Image">
                </div>
            `;
        }).join('');

        document.querySelectorAll(".image-selection").forEach(element => {
            element.addEventListener("click", () => {
                const imageId = Number(element.dataset.imageId);
                imageSelectionnee = images.find(img => img.id === imageId);

                // CORRECTION 1 : On vide l'input fichier pour éviter le conflit
                document.getElementById("image").value = "";

                afficherImageExistante({ imageResponse: imageSelectionnee, imageData: null });
                modalImages.classList.remove("visible");
                mettreAJourEtatBoutonIa();
            });
        });

        modalImages.classList.add("visible");
    } catch (error) {
        afficherErreur("Impossible de charger les images.");
    }
}

async function chargerProduits() {
    try {
        const produits = await apiCall("/api/produits");
        produitTable.setData(produits);
    } catch (error) {
        afficherErreur("Impossible de contacter le serveur.");
    }
}

// --- Gestion des images du formulaire ---
function chargerProduitDansFormulaire(produit) {
    imageSelectionnee = null;
    document.getElementById("produit-id").value = produit.id;
    document.getElementById("code-barre").value = produit.codeBarre;
    document.getElementById("nom").value = produit.nom;
    document.getElementById("prix").value = produit.prix;
    document.getElementById("description").value = produit.description || "";

    // On réinitialise aussi l'input fichier au chargement d'un produit
    document.getElementById("image").value = "";

    afficherImageExistante(produit.image);
    masquerSucces();
    mettreAJourEtatBoutonIa();
}

function afficherImageExistante(imageSwitch) {
    if (!imageSwitch?.imageResponse) {
        appliquerApercuImage(null, true);
        return;
    }
    appliquerApercuImage("/" + imageSwitch.imageResponse.imagePath, false);
}

function afficherNouvelleImage() {
    // CORRECTION 2 : On détache l'ancienne image existante si on choisit un fichier
    imageSelectionnee = null;
    
    const fichier = document.getElementById("image").files[0];
    if (!fichier) {
        mettreAJourEtatBoutonIa();
        return;
    }

    appliquerApercuImage(URL.createObjectURL(fichier), false);
}

function fichierVersBase64(fichier) {
    return new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(lecteur.result.split(",")[1]);
        lecteur.onerror = reject;
        lecteur.readAsDataURL(fichier);
    });
}

async function construireImage(produitExistant) {
    const fichier = document.getElementById("image").files[0];

    if (fichier) {
        return {
            imageResponse: null,
            imageData: {
                data: await fichierVersBase64(fichier),
                contentType: fichier.type
            }
        };
    }

    if (imageSelectionnee) {
        return { imageResponse: imageSelectionnee, imageData: null };
    }

    if (produitExistant?.image?.imageResponse) {
        return { imageResponse: produitExistant.image.imageResponse, imageData: null };
    }

    return { imageResponse: null, imageData: null };
}

// --- Analyse IA ---
async function analyserImageAvecIa() {
    const boutonAnalyserIa = document.getElementById("btn-analyser-ia");
    if (boutonAnalyserIa.disabled) return;

    boutonAnalyserIa.disabled = true;
    const texteOriginal = boutonAnalyserIa.textContent;
    boutonAnalyserIa.textContent = "Analyse...";

    try {
        const produitExistant = getProduitExistantCourant();
        const imageSwitch = await construireImage(produitExistant);

        const resultat = await apiCall("/api/ImageAnalysis/analyze", {
            method: "POST",
            body: JSON.stringify(imageSwitch)
        });

        if (resultat) {
            if (resultat.title) {
                document.getElementById("nom").value = resultat.title;
            }
            if (resultat.description) {
                document.getElementById("description").value = resultat.description;
            }
        }
    } catch (error) {
        afficherErreur("Erreur lors de l'analyse de l'image par l'IA.");
    } finally {
        boutonAnalyserIa.disabled = false;
        boutonAnalyserIa.textContent = texteOriginal;
    }
}

// --- Enregistrement & Suppression ---
async function enregistrerProduit(event) {
    event.preventDefault();

    const boutonSubmit = document.querySelector('#produit-form button[type="submit"]');
    if (boutonSubmit.disabled) return;

    boutonSubmit.disabled = true;
    const texteOriginal = boutonSubmit.textContent;
    boutonSubmit.textContent = "Enregistrement…";

    const id = document.getElementById("produit-id").value;
    const codeBarre = document.getElementById("code-barre").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const prix = Number(document.getElementById("prix").value);
    const description = document.getElementById("description").value.trim();

    try {
        const produitExistant = getProduitExistantCourant();
        const image = await construireImage(produitExistant);
        const payload = { codeBarre, nom, prix, description: description || null, image };
        
        let produit;
        if (id === "") {
            produit = await apiCall("/api/produits", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        } else {
            payload.id = Number(id);
            produit = await apiCall("/api/produits", {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        }

        chargerProduitDansFormulaire(produit);
        await chargerProduits();
        nettoyerFormulaire();
        afficherSucces();
    } catch (error) {
        afficherErreur("Une erreur est survenue lors de l'enregistrement.");
    } finally {
        boutonSubmit.disabled = false;
        boutonSubmit.textContent = texteOriginal;
    }
}

async function supprimerProduit(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
        await apiCall(`/api/produits/${id}`, { method: "DELETE" });
        nettoyerFormulaire();
        await chargerProduits();
    } catch (error) {
        afficherErreur("Impossible de supprimer le produit.");
    }
}

// --- Utilitaires visuels ---
function nettoyerFormulaire() {
    imageSelectionnee = null;
    document.getElementById("produit-form").reset();
    document.getElementById("produit-id").value = "";
    document.getElementById("code-barre").value = "";
    document.getElementById("image").value = ""; // On nettoie aussi l'input fichier

    appliquerApercuImage(null, true);
    masquerSucces();
    mettreAJourEtatBoutonIa();
}

function afficherSucces() {
    const message = document.getElementById("message-succes");
    message.textContent = "✓ Produit enregistré";
    message.classList.add("visible");
}

function masquerSucces() {
    document.getElementById("message-succes").classList.remove("visible");
}

function afficherErreur(messageTexte) {
    alert(messageTexte);
}