<img width="565" height="882" alt="Capture d&#39;écran 2026-03-30 123818" src="https://github.com/user-attachments/assets/e999b5b2-b2e6-4572-9c8d-29ad9d0b650e" />

# Darija Translator Extension

Une extension Chrome permettant de traduire rapidement du texte en **darija marocaine** grâce à des APIs d’intelligence artificielle comme OpenAI, Claude ou Gemini.

---

# 📌 Description

Cette extension permet à l’utilisateur de :

- sélectionner du texte sur une page web
- ouvrir l’extension
- traduire automatiquement le texte en darija

Le projet utilise des APIs d’IA pour produire des traductions plus naturelles et contextuelles que les traducteurs classiques.

---

# 🚀 Fonctionnalités

## ✅ Traduction en darija
Traduction intelligente depuis :
- Français
- Anglais
- Arabe
- autres langues compatibles

---

## ✅ Support multi-API
Compatible avec :
- OpenAI
- Claude
- Gemini
- APIs OpenAI-compatible

---

## ✅ Détection automatique de configuration
L’extension vérifie automatiquement :
- API URL
- API Key
- modèle IA utilisé

---

## ✅ Interface dynamique
L’interface change selon l’état de configuration :
- Ready ✅
- Not configured ⚠️

---

## ✅ Stockage local et synchronisé
Utilisation de :
- `chrome.storage.local`
- `chrome.storage.sync`

pour sauvegarder :
- texte sélectionné
- configuration API

---

## ✅ Sécurité et limitation des requêtes
Implémentation d’un système de :
- rate limiting
- contrôle anti-spam
- validation utilisateur

---

# 🛠️ Technologies utilisées

## Frontend
- HTML
- CSS
- JavaScript

## APIs IA
- OpenAI API
- Claude API
- Gemini API

## Chrome Extension API
- `chrome.storage`
- `chrome.runtime`
- `DOMContentLoaded`

---

# ⚙️ Fonctionnement du projet

## 1. Initialisation
Au chargement :
- vérification de la configuration API
- chargement du texte sélectionné

```javascript
document.addEventListener("DOMContentLoaded", async () => {
  await checkApiKey();
  await loadSelectedText();
});<img width="633" height="884" alt="Capture d&#39;écran 2026-05-26 165740" src="https://github.com/user-attachments/assets/86a2abb9-963c-4eed-8972-bb9303f1f49c" />
