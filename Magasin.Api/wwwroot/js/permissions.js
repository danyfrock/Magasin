// /js/permissions.js

const ReglesBoutonsInterdits = {
    Caissier: [
        // IDs ou sélecteurs CSS des boutons interdits pour le caissier
        "#produit-submit", 
        "#stock-submit",
        "#utilisateur-submit"
    ],
    Magasinier: [
        "#utilisateur-submit",
        "#validerVente"
    ]
};

function appliquerRestrictionsVisuelles() {
    const userRole = sessionStorage.getItem("userRole");
    if (!userRole) return;

    const selecteursInterdits = ReglesBoutonsInterdits[userRole];
    if (!selecteursInterdits) return;

    // Pour chaque élément interdit, on le grise et on bloque le clic
    selecteursInterdits.forEach(selecteur => {
        // querySelectorAll gère aussi bien les ID (#) que les classes (.)
        const elements = document.querySelectorAll(selecteur);
        
        elements.forEach(el => {
            el.disabled = true; // Grise le bouton
            el.style.opacity = "0.5"; // Atténue visuellement
            el.style.cursor = "not-allowed"; // Change le curseur
            
            // Empêche l'action au clic au cas où
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                alert("Action non autorisée pour votre profil.");
            }, true);
        });
    });
}

// S'exécute automatiquement dès que la page est chargée
document.addEventListener("DOMContentLoaded", () => {
    // Petit délai pour laisser le bandeau charger le rôle dans le sessionStorage
    setTimeout(appliquerRestrictionsVisuelles, 150);
});