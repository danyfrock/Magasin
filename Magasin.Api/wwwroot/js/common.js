async function apiCall(url, options = {}) {
    const defaultHeaders = {};
    if (options.body && !(options.body instanceof FormData)) {
        defaultHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
    });

    if (!response.ok) {
        // On conserve l'objet response pour permettre de gérer les status spécifiques (ex: 404) dans les fonctions appelantes
        const error = new Error(`Erreur serveur (${response.status})`);
        error.response = response;
        throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return null;
}