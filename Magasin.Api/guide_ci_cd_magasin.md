# Pipeline CI/CD GitHub Actions & Inno Setup

Ce guide détaille la mise en place et l'utilisation du pipeline d'intégration et de déploiement continus (CI/CD) pour l'application **Magasin**.

---

## 1. Principe de fonctionnement

À chaque fois que du code est poussé ou mergé sur la branche `main` :
1. GitHub Actions démarre une machine virtuelle Windows (`windows-latest`).
2. Le SDK **.NET 10** est installé sur le runner.
3. Le projet `Magasin.Api` est publié en mode `Release` (`win-x64`, autonome/self-contained) directement dans le dossier `Installer\resources\MagasinPublish`.
4. **Inno Setup** est installé à la volée via `winget`.
5. Le script `Installer\InstallMagasin.iss` est compilé sans modifier son contenu.
6. Le fichier d'installation généré (`Installer\output\InstallMagasin-v*.exe`) est automatiquement publié sous forme de **Release GitHub**.

---

## 2. Emplacement du fichier de Pipeline

Le workflow est piloté par le fichier YAML situé à la racine du dépôt :

```text
.github/workflows/release.yml
```

> **Attention aux chemins relatifs :** Tous les chemins d'accès dans le fichier `.yml` sont définis par rapport à la racine du projet (`Magasin\`) pour fonctionner aussi bien en local que sur les serveurs GitHub Actions.

---

## 3. Contenu complet du fichier `.github/workflows/release.yml`

```yaml
name: Build and Release Magasin

on:
  push:
    branches:
      - main

jobs:
  build-and-release:
    runs-on: windows-latest

    steps:
      # 1. Récupérer le code source
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Installer le SDK .NET 10
      - name: Setup .NET SDK
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.x'

      # 3. Publier l'API dans le dossier resources de l'installeur
      - name: Publish .NET Application
        run: |
          dotnet publish Magasin.Api\Magasin.Api.csproj -c Release -r win-x64 --self-contained true -o Installer\resources\MagasinPublish
        shell: pwsh

      # 4. Installer Inno Setup sur le serveur GitHub
      - name: Install Inno Setup
        run: |
          winget install JRSoftware.InnoSetup --silent --accept-source-agreements --accept-package-agreements
        shell: pwsh

      # 5. Compiler le script Inno Setup d'origine
      - name: Compile Magasin Installer
        run: |
          $iscc = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
          & $iscc "Installer\InstallMagasin.iss"
        shell: pwsh

      # 6. Publier l'exécutable généré dans une Release GitHub
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            Installer\output\InstallMagasin-*.exe
          tag_name: release-${{ github.run_number }}
          name: "Magasin Release #${{ github.run_number }}"
          body: "Mise à jour automatique suite au push sur main."
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 4. Prérequis et Sécurité sur GitHub

Pour que le pipeline ait le droit de publier les releases automatiquement :
1. Sur GitHub, aller dans **Settings** du dépôt > **Actions** > **General**.
2. Dans la section **Workflow permissions**, sélectionner **Read and write permissions**.
3. Cliquer sur **Save**.

---

## 5. Procédure pour sortir une nouvelle version

### Étape 1 : Mettre à jour la version dans l'installeur
Ouvrir `Installer\InstallMagasin.iss` et modifier le numéro de version :
```iss
#define MyAppVersion "2.1.3"
```

### Étape 2 : Développer et valider sur `dev`
Travailler normalement sur la branche `dev`.

### Étape 3 : Merger vers `main` et pousser
```powershell
git checkout main
git merge dev
git push origin main
```

Dès le `git push` effectué, le workflow se déclenche sur GitHub. L'exécutable `InstallMagasin-v2.1.3.exe` sera disponible quelques minutes plus tard dans la rubrique **Releases** du dépôt.