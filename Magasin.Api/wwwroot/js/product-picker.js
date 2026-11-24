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
    let els = null;

    const pick = (obj, ...keys) => {
        for (const k of keys) {
            if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
        }
        return undefined;
    };

    function getElements() {
        if (els) return els;
        els = {
            s1: root.querySelector("[data-picker-s1]"),
            s2: root.querySelector("[data-picker-s2]"),
            b1: root.querySelector("[data-picker-b1]"),
            closeBtn: root.querySelector("[data-picker-close]"),
            listEl: root.querySelector("[data-picker-list]")
        };
        return els;
    }

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
        getElements();

        if (!wired) {
            wireEvents();
            wired = true;
        }
    }

    function setMessage(text) {
        const { listEl } = getElements();
        const div = document.createElement("div");
        div.className = "picker-empty";
        div.textContent = text;
        listEl.replaceChildren(div);
    }

    function resolveImageSrc(produit) {
        const sw = pick(produit, "image", "Image");
        const resp = pick(sw, "imageResponse", "ImageResponse");
        const path = pick(resp, "imagePath", "ImagePath");

        if (!path) return "";
        if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;
        return `/${path.replace(/^\/+/, "")}`;
    }

    function renderItems(items) {
        const { listEl } = getElements();

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
            img.alt = pick(p, "nom", "Nom") ?? "";

            const nom = document.createElement("span");
            nom.className = "picker-item-nom";
            nom.textContent = pick(p, "nom", "Nom") ?? "";

            const prixVal = pick(p, "prix", "Prix");
            const prix = document.createElement("span");
            prix.className = "picker-item-prix";
            prix.textContent = typeof prixVal === "number" ? `${prixVal.toFixed(2)} €` : "";

            btn.append(img, nom, prix);
            btn.addEventListener("click", () => {
                const code = pick(p, "codeBarre", "CodeBarre") ?? "";
                close();
                activeCallback?.(code, p);
            });

            fragment.appendChild(btn);
        }

        listEl.replaceChildren(fragment);
    }

    async function runSearch() {
        const { s1, s2 } = getElements();
        const texte = s1.value.trim();
        const texteIntelligent = s2.value.trim();

        if (!texte && !texteIntelligent) {
            setMessage("Saisis un critère de recherche.");
            return;
        }

        setMessage("Recherche en cours...");

        try {
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

    function wireEvents() {
        const { s1, s2, b1, closeBtn } = getElements();
        const onEnter = (e) => {
            if (e.key === "Enter") runSearch();
        };

        b1.addEventListener("click", runSearch);
        s1.addEventListener("keydown", onEnter);
        s2.addEventListener("keydown", onEnter);
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
        const { s1, s2, listEl } = getElements();

        s1.value = initialText;
        s2.value = "";
        listEl.replaceChildren();
        root.classList.add("visible");
        root.setAttribute("aria-hidden", "false");
        s1.focus();

        if (initialText.trim()) {
            await runSearch();
        }
    }

    return { open, close };
}