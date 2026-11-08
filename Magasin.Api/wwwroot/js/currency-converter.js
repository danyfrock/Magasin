class CurrencyConverter extends HTMLElement {
  constructor() {
    super();
    this.apiBase = '/api/caisse';
    this.currencies = [];
    this.defaultCurrency = 'XOF';
    this._lastDetail = null;
  }

  connectedCallback() {
    // Clone le template s'il existe, sinon fallback minimal
    const template = document.getElementById('currency-converter-template');
    if (template) {
      this.appendChild(template.content.cloneNode(true));
    } else {
      this.innerHTML = `
        <div class="card converter-card">
          <div class="converter-row">
            <div class="montant-group">
              <label for="montant">Montant reçu</label>
              <input type="number" id="montant" value="100" step="any" min="0">
            </div>
            <div class="montant-group">
              <label for="from">Devise client</label>
              <select id="from" class="theme-selector"></select>
            </div>
            <div class="montant-group">
              <label for="to">Devise caisse</label>
              <select id="to" class="theme-selector"></select>
            </div>
          </div>
          <div class="converter-result">
            <span>Équivalent caisse :</span>
            <strong id="result">—</strong>
          </div>
        </div>
      `;
    }

    this.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => this.handleConvert());
    });

    this.initData();
  }

  async initData() {
    await Promise.all([
      this.fetchDeviseCaisse(),
      this.fetchCurrencies()
    ]);
  }

  async fetchDeviseCaisse() {
    try {
      const response = await fetch(`${this.apiBase}/devise`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      this.defaultCurrency = data.deviseCaisse || data.DeviseCaisse || 'XOF';
    } catch {
      this.defaultCurrency = 'XOF';
    }
  }

  async fetchCurrencies() {
    try {
      const response = await fetch(`${this.apiBase}/currencies`);
      if (!response.ok) throw new Error();
      this.currencies = await response.json();
      this.populateSelects();
      this.handleConvert();
    } catch {
      const res = this.querySelector('#result');
      if (res) res.textContent = 'Erreur devises';
    }
  }

  populateSelects() {
    const fromSelect = this.querySelector('#from');
    const toSelect = this.querySelector('#to');
    if (!fromSelect || !toSelect) return;

    const options = this.currencies
      .map(c => `<option value="${c}">${c}</option>`)
      .join('');

    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;

    // Valeurs par défaut intelligentes
    if (this.currencies.includes('EUR')) fromSelect.value = 'EUR';
    else if (this.currencies.length) fromSelect.value = this.currencies[0];

    if (this.currencies.includes(this.defaultCurrency)) {
      toSelect.value = this.defaultCurrency;
    }
  }

  async handleConvert() {
    const montantInput = this.querySelector('#montant');
    const fromSelect = this.querySelector('#from');
    const toSelect = this.querySelector('#to');
    const resultEl = this.querySelector('#result');

    if (!montantInput || !fromSelect || !toSelect || !resultEl) return;

    const montant = parseFloat(montantInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (isNaN(montant) || montant <= 0 || !from || !to) {
      resultEl.textContent = '—';
      this._lastDetail = null;
      return;
    }

    // Même devise → pas d'appel API
    if (from === to) {
      const rounded = montant.toFixed(2);
      resultEl.textContent = `${rounded} ${to}`;
      this._dispatch(Number(rounded), from, to, montant);
      return;
    }

    try {
      resultEl.textContent = '...';
      const response = await fetch(
        `${this.apiBase}/convertir?montant=${montant}&from=${from}&to=${to}`
      );
      if (!response.ok) throw new Error('HTTP ' + response.status);

      const data = await response.json();

      // Champ exact de ton API
      const montantCible = data.montantCible ?? data.resultat ?? data.result ?? data.amount;
      const parsed = parseFloat(montantCible);

      if (isNaN(parsed)) throw new Error('Montant invalide');

      const rounded = parsed.toFixed(2);
      resultEl.textContent = `${rounded} ${to}`;
      this._dispatch(Number(rounded), from, to, montant);
    } catch (err) {
      console.error('Conversion error:', err);
      resultEl.textContent = 'Erreur conversion';
      this._lastDetail = null;
    }
  }

  _dispatch(montantConverti, deviseSource, deviseCaisse, montantOriginal) {
    this._lastDetail = {
      montant: montantConverti,
      devise: deviseSource,
      deviseCaisse,
      montantOriginal
    };

    this.dispatchEvent(new CustomEvent('devise-convertie', {
      detail: this._lastDetail,
      bubbles: true,
      composed: true
    }));
  }

  /** Réinitialise le composant (appelé à la fermeture de la modal) */
  reset() {
    const montantInput = this.querySelector('#montant');
    if (montantInput) montantInput.value = '100';
    this._lastDetail = null;
    this.handleConvert();
  }

  /** Permet de récupérer la dernière conversion sans événement */
  getLastConversion() {
    return this._lastDetail;
  }
}

customElements.define('currency-converter', CurrencyConverter);