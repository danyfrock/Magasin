(function () {
    const API_BASE = "/api/PotCommun";

    class PotCommun {
        constructor({ getCurrentUserId, onReprendre } = {}) {
            this.getCurrentUserId = getCurrentUserId;
            this.onReprendre = onReprendre;

            this.toggleBtn = document.getElementById("pot-commun-toggle");
            this.closeBtn = document.getElementById("pot-commun-close");
            this.drawer = document.getElementById("pot-commun-drawer");
            this.badge = document.getElementById("pot-commun-badge");
            this.form = document.getElementById("pot-commun-form");
            this.input = document.getElementById("pot-commun-message");
            this.attachmentBox = document.getElementById("pot-commun-attachment");
            this.targetPreview = document.getElementById("pot-commun-target-preview");
            this.clearTargetBtn = document.getElementById("pot-commun-clear-target");
            this.listEl = document.getElementById("pot-commun-list");
            this.statusEl = document.getElementById("pot-commun-status");

            // venteActive : vente en cours côté page / pot
            // venteJointe : true si la vente est actuellement affichée en PJ
            // produitEnAttente : produit prêt si pas de vente ou si la vente est retirée
            this.venteActive = null;
            this.venteLabel = null;
            this.venteJointe = false;
            this.produitEnAttente = null;
            this.produitJoint = null;
            this.isRefreshing = false;

            this.bindEvents();
            this.refresh();
        }

        bindEvents() {
            this.toggleBtn?.addEventListener("click", () => this.toggle());
            this.closeBtn?.addEventListener("click", () => this.close());
            this.clearTargetBtn?.addEventListener("click", () => this.retirerPieceJointe());
            this.form?.addEventListener("submit", (event) => this.handleSubmit(event));
            this.input?.addEventListener("keydown", (event) => this.handleInputKeydown(event));

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && this.drawer && !this.drawer.hidden) {
                    this.close();
                }
            });
        }

        open() {
            if (!this.drawer || !this.toggleBtn) return;

            this.drawer.hidden = false;
            this.drawer.setAttribute("aria-hidden", "false");
            this.toggleBtn.setAttribute("aria-expanded", "true");
            this.refresh();
            this.input?.focus();
        }

        close() {
            if (!this.drawer || !this.toggleBtn) return;

            this.drawer.hidden = true;
            this.drawer.setAttribute("aria-hidden", "true");
            this.toggleBtn.setAttribute("aria-expanded", "false");
        }

        toggle() {
            if (!this.drawer) return;
            this.drawer.hidden ? this.open() : this.close();
        }

        clear() {
            this.venteActive = null;
            this.venteLabel = null;
            this.venteJointe = false;
            this.produitEnAttente = null;
            this.produitJoint = null;
            if (this.input) this.input.value = "";
            this.rafraichirPieceJointe();
        }

        retirerPieceJointe() {
            if (this.venteJointe) {
                this.venteJointe = false;
                if (this.produitEnAttente) {
                    this.produitJoint = { ...this.produitEnAttente };
                }
                this.rafraichirPieceJointe();
                return;
            }

            this.produitJoint = null;
            this.produitEnAttente = null;
            this.rafraichirPieceJointe();
        }

        chargerProduit(produit, { openDrawer = true } = {}) {
            const id = typeof produit === "object" ? produit?.id : produit;
            if (!id) return;

            const nom = typeof produit === "object" ? (produit?.nom ?? produit?.Nom) : null;
            const label = nom ? `Produit : ${nom}` : `Produit #${id}`;
            const itemProduit = { id: Number(id), label };

            this.produitEnAttente = itemProduit;

            // La vente est prioritaire : si une vente est jointe, le produit attend
            if (!this.venteJointe) {
                this.produitJoint = itemProduit;
            }

            this.rafraichirPieceJointe();
            if (openDrawer) this.open();
        }

        chargerVente(venteDto, { openDrawer = false, label = null } = {}) {
            if (!venteDto) {
                this.venteActive = null;
                this.venteLabel = null;
                this.venteJointe = false;
                if (this.produitEnAttente) {
                    this.produitJoint = { ...this.produitEnAttente };
                }
                this.rafraichirPieceJointe();
                return;
            }

            this.venteActive = venteDto;
            this.venteLabel = label || "Vente en cours";
            this.venteJointe = true;
            this.produitJoint = null;

            this.rafraichirPieceJointe();
            if (openDrawer) this.open();
        }

        rafraichirPieceJointe() {
            if (!this.attachmentBox || !this.targetPreview) return;

            if (this.venteJointe && this.venteActive) {
                this.attachmentBox.hidden = false;
                this.targetPreview.textContent = `Pièce jointe : ${this.venteLabel}`;
                return;
            }

            if (this.produitJoint) {
                this.attachmentBox.hidden = false;
                this.targetPreview.textContent = `Pièce jointe : ${this.produitJoint.label}`;
                return;
            }

            this.attachmentBox.hidden = true;
            this.targetPreview.textContent = "";
        }

        async handleInputKeydown(event) {
            if (event.key !== "Enter") return;

            const texte = this.input?.value.trim() ?? "";
            if (!texte || !/^\d{6,14}$/.test(texte)) return;

            // Uniquement si aucune vente n'est présente dans le pot
            if (this.venteActive || this.venteJointe) return;

            event.preventDefault();
            try {
                const res = await fetch(`/api/produits/${encodeURIComponent(texte)}`, {
                    credentials: "include"
                });
                if (!res.ok) return;

                const produit = await res.json();
                if (!produit?.id) return;

                this.input.value = "";
                this.chargerProduit(produit, { openDrawer: true });
                this.afficherStatut("Produit ajouté en pièce jointe.");
            } catch {
                // Ignore si ce n'est pas un code-barres produit
            }
        }

        afficherStatut(message, erreur = false) {
            if (!this.statusEl) return;
            this.statusEl.textContent = message;
            this.statusEl.classList.toggle("is-error", erreur);
        }

        async refresh() {
            if (this.isRefreshing) return;

            this.isRefreshing = true;
            try {
                const response = await fetch(API_BASE, { credentials: "include" });
                if (!response.ok) {
                    this.afficherStatut("Impossible de charger les messages.", true);
                    return;
                }

                const items = await response.json();
                if (!Array.isArray(items)) {
                    this.afficherStatut("Réponse invalide du serveur.", true);
                    return;
                }

                this.afficherStatut("");
                this.renderBadge(items.length);
                this.renderList(items);
            } catch (error) {
                this.afficherStatut("Connexion au Pot commun impossible.", true);
                console.error("Erreur de chargement du Pot commun :", error);
            } finally {
                this.isRefreshing = false;
            }
        }

        async handleSubmit(event) {
            event.preventDefault();

            let message = this.input?.value.trim() ?? "";

            // Si aucune vente n'est présente et que le message est un code-barres
            if (!this.venteActive && !this.venteJointe && !this.produitJoint && /^\d{6,14}$/.test(message)) {
                try {
                    const res = await fetch(`/api/produits/${encodeURIComponent(message)}`, {
                        credentials: "include"
                    });
                    if (res.ok) {
                        const produit = await res.json();
                        if (produit?.id) {
                            this.input.value = "";
                            this.chargerProduit(produit, { openDrawer: true });
                            this.afficherStatut("Produit ajouté en pièce jointe.");
                            return;
                        }
                    }
                } catch {
                    // Envoi normal du texte si pas un produit
                }
            }

            const venteAEnvoyer = this.venteJointe ? this.venteActive : null;
            const produitAEnvoyer = !venteAEnvoyer ? (this.produitJoint?.id ?? null) : null;

            if (!message && !venteAEnvoyer && !produitAEnvoyer) return;

            const utilisateurId = this.getCurrentUserId?.();
            if (!utilisateurId) {
                this.afficherStatut("Utilisateur connecté introuvable.", true);
                return;
            }

            const payload = {
                utilisateurId: Number(utilisateurId),
                message,
                produitId: produitAEnvoyer,
                vente: venteAEnvoyer
            };

            const submitButton = this.form?.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;

            try {
                const response = await fetch(API_BASE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    this.afficherStatut("Le message n'a pas pu être envoyé.", true);
                    return;
                }

                if (this.input) this.input.value = "";

                // Supprime la PJ produit après envoi ; si une vente est active, elle redevient prioritaire
                if (this.produitJoint) {
                    this.produitJoint = null;
                    this.produitEnAttente = null;
                    if (this.venteActive) {
                        this.venteJointe = true;
                    }
                }

                this.rafraichirPieceJointe();
                this.afficherStatut("Message envoyé.");
                await this.refresh();
            } catch (error) {
                this.afficherStatut("Erreur lors de l'envoi du message.", true);
                console.error("Erreur d'envoi au Pot commun :", error);
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }

        renderBadge(count) {
            if (!this.badge) return;
            this.badge.textContent = String(count);
            this.badge.hidden = count === 0;
        }

        renderList(items) {
            if (!this.listEl) return;
            this.listEl.replaceChildren();

            if (items.length === 0) {
                const empty = document.createElement("p");
                empty.className = "text-muted text-center";
                empty.textContent = "Aucun message dans le pot commun.";
                this.listEl.appendChild(empty);
                return;
            }

            for (const item of items) {
                const card = document.createElement("article");
                card.className = "card pot-commun-item";

                const meta = document.createElement("div");
                meta.className = "pot-commun-item-meta";

                const author = document.createElement("strong");
                author.textContent = item.auteur ?? "Utilisateur";

                const time = document.createElement("span");
                time.textContent = item.dateCreation ? ` • ${this.formatTime(item.dateCreation)}` : "";
                meta.append(author, time);
                card.appendChild(meta);

                if (item.message) {
                    const message = document.createElement("p");
                    message.className = "pot-commun-item-commentaire";
                    message.textContent = item.message;
                    card.appendChild(message);
                }

                if (item.produitId) {
                    const target = document.createElement("div");
                    target.className = "pot-commun-cible";
                    target.textContent = item.produitNom
                        ? `Produit : ${item.produitNom}`
                        : `Produit #${item.produitId}`;
                    card.appendChild(target);
                }

                if (item.venteId) {
                    const target = document.createElement("div");
                    target.className = "pot-commun-cible";
                    const total = Number(item.venteTotal);
                    const totalText = Number.isFinite(total) ? ` — ${total.toLocaleString()}` : "";
                    target.textContent = `Vente #${item.venteId}${totalText}`;
                    card.appendChild(target);
                }

                if (item.produitId || item.venteId) {
                    const actions = document.createElement("div");
                    actions.className = "pot-commun-item-actions";

                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "btn-primary";
                    button.textContent = "Reprendre";
                    button.addEventListener("click", () => {
                        const payload = {
                            produitId: item.produitId ?? undefined,
                            venteId: item.venteId ?? undefined,
                            item
                        };

                        if (payload.venteId && !document.getElementById("validerVente")) {
                            sessionStorage.setItem("reprendreVenteId", String(payload.venteId));
                            this.close();
                            window.location.href = "/pages/vente.html";
                            return;
                        }

                        this.onReprendre?.(payload);
                        this.close();
                    });

                    actions.appendChild(button);
                    card.appendChild(actions);
                }

                this.listEl.appendChild(card);
            }
        }

        formatTime(dateString) {
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return "";
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
    }

    window.PotCommun = PotCommun;
})();