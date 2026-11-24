export function createProductPicker({
    onSelect,
    mode = "modal", // "modal" ou "drawer"
    htmlUrl = "./product-picker.html",
    searchUrl = "/api/produits/search",
    smartSearchUrl = "/api/produits/smart-search",
    topN = 5
} = {}) {
    let root = document.getElementById("product-picker-modal");
    let activeCallback = typeof onSelect === "function" ? onSelect : null;
    let wired = false;

    async function ensureMounted() {
        if (!root) {
            const resp = await fetch(htmlUrl);
            if (!resp.ok) {
                throw new Error(`Impossible de charger ${htmlUrl} (${resp.status})`);
            }
            const html = await resp.text();
            const container = document.createElement("div");
            container.innerHTML = html.trim();
            root = container.firstElementChild;
            document.body.appendChild(root);
        }

        root.classList.toggle("picker-drawer", mode === "drawer");

        if (!wired) {
            wireEvents();
            wired = true;
        }
    }

    function wireEvents() {
        const s1 = root.querySelector("[data-picker-s1]");
        const s2 = root.querySelector("[data-picker-s2]");
        const b1 = root.querySelector("[data-picker-b1]");
        const closeBtn = root.querySelector("[data-picker-close]");
        const listEl = root.querySelector("[data-picker-list]");

        function setMessage(text) {
            listEl.replaceChildren();
            const div = document.createElement("div");
            div.className = "picker-empty";
            div.textContent = text;
            listEl.appendChild(div);
        }

        function resolveImageSrc(produit) {
            const sw = produit?.image ?? produit?.Image;
            const resp = sw?.imageResponse ?? sw?.ImageResponse;
            return resp?.imagePath ?? resp?.ImagePath ?? "";
        }

        function renderItems(items) {
            if (!Array.isArray(items) || items.length === 0) {
                setMessage("Aucun produit trouvé.");
                return;
            }

            const fragment = document.createDocumentFragment();
            for (const p of items) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "picker-item";

                const img = document.createElement("img");
                img.src = resolveImageSrc(p);
                img.alt = p.nom ?? p.Nom ?? "";

                const nom = document.createElement("span");
                nom.className = "picker-item-nom";
                nom.textContent = p.nom ?? p.Nom ?? "";

                const prixVal = p.prix ?? p.Prix;
                const prix = document.createElement("span");
                prix.className = "picker-item-prix";
                prix.textContent = typeof prixVal === "number" ? `${prixVal.toFixed(2)} €` : "";

                btn.append(img, nom, prix);
                btn.addEventListener("click", () => {
                    const code = p.codeBarre ?? p.CodeBarre ?? "";
                    close();
                    if (activeCallback) {
                        activeCallback(code, p);
                    }
                });

                fragment.appendChild(btn);
            }

            listEl.replaceChildren(fragment);
        }

        async function runSearch() {
            const texte = s1.value.trim();
            const texteIntelligent = s2.value.trim();

            if (!texte && !texteIntelligent) {
                setMessage("Saisis un critère de recherche.");
                return;
            }

            setMessage("Recherche en cours...");

            try {
                console.log({ texte, texteIntelligent, s1Val: s1?.value, s2Val: s2?.value });
                const url = texteIntelligent
                    ? `${smartSearchUrl}?texte=${encodeURIComponent(texte)}&texteIntelligent=${encodeURIComponent(texteIntelligent)}&topN=${topN}`
                    : `${searchUrl}?texte=${encodeURIComponent(texte)}`;

                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                renderItems(data);
            } catch {
                setMessage("Erreur lors de la recherche.");
            }
        }

        b1.addEventListener("click", runSearch);
        s1.addEventListener("keydown", (e) => {
            if (e.key === "Enter") runSearch();
        });
        s2.addEventListener("keydown", (e) => {
            if (e.key === "Enter") runSearch();
        });
        closeBtn.addEventListener("click", close);
        root.addEventListener("click", (e) => {
            if (e.target === root) close();
        });
    }

    function close() {
        if (!root) return;
        root.classList.remove("visible");
        root.setAttribute("aria-hidden", "true");
    }

    async function open({ onSelect: nextOnSelect, initialText = "" } = {}) {
        if (typeof nextOnSelect === "function") {
            activeCallback = nextOnSelect;
        }

        await ensureMounted();

        const s1 = root.querySelector("[data-picker-s1]");
        const listEl = root.querySelector("[data-picker-list]");

        s1.value = initialText;
        listEl.replaceChildren();
        root.classList.add("visible");
        root.setAttribute("aria-hidden", "false");
        s1.focus();

        if (initialText.trim()) {
            const b1 = root.querySelector("[data-picker-b1]");
            b1.click();
        }
    }

    return { open, close };
}