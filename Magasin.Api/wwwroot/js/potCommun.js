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

            this.attachment = null;
            this.isRefreshing = false;

            this.bindEvents();
            this.clear();
            this.refresh();
        }

        bindEvents() {
            this.toggleBtn?.addEventListener("click", () => this.toggle());
            this.closeBtn?.addEventListener("click", () => this.close());
            this.clearTargetBtn?.addEventListener("click", () => this.clearAttachment());
            this.form?.addEventListener("submit", (event) => this.handleSubmit(event));

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

        clearAttachment() {
            this.attachment = null;
            if (this.attachmentBox) this.attachmentBox.hidden = true;
            if (this.targetPreview) this.targetPreview.textContent = "";
        }

        clear() {
            this.clearAttachment();
            if (this.input) this.input.value = "";
        }

        chargerProduit(produit, { openDrawer = true } = {}) {
            const id = typeof produit === "object" ? produit?.id : produit;
            if (!id) return;

            const nom = typeof produit === "object" ? (produit?.nom ?? produit?.Nom) : null;
            const label = nom ? `Joint au message : Produit — ${nom}` : `Joint au message : Produit #${id}`;

            this.attachment = { produitId: Number(id), label };
            this.afficherPieceJointe(label, openDrawer);
        }

        chargerVente(venteDto, { openDrawer = false, label = null } = {}) {
            if (!venteDto) {
                this.clearAttachment();
                return;
            }

            const texte = label || "Joint au message : Vente en cours";
            this.attachment = { vente: venteDto, label: texte };
            this.afficherPieceJointe(texte, openDrawer);
        }

        afficherPieceJointe(label, openDrawer) {
            if (this.attachmentBox && this.targetPreview) {
                this.attachmentBox.hidden = false;
                this.targetPreview.textContent = label;
            }

            if (openDrawer) {
                this.open();
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

            const message = this.input?.value.trim() ?? "";
            const hasAttachment = Boolean(this.attachment?.produitId || this.attachment?.vente);
            if (!message && !hasAttachment) return;

            const utilisateurId = this.getCurrentUserId?.();
            if (!utilisateurId) {
                this.afficherStatut("Utilisateur connecté introuvable.", true);
                return;
            }

            const payload = {
                utilisateurId: Number(utilisateurId),
                message,
                produitId: this.attachment?.produitId ?? null,
                vente: this.attachment?.vente ?? null
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

                this.clear();
                this.afficherStatut(hasAttachment ? "Message envoyé avec élément joint." : "Message envoyé.");
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
                        this.onReprendre?.({
                            produitId: item.produitId ?? undefined,
                            venteId: item.venteId ?? undefined,
                            item
                        });
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