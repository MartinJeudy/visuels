# Hormur Visual Editor

Éditeur de visuels d'événements pour la plateforme Hormur.

## 🎨 Fonctionnalités

- ✅ Création d'affiches personnalisées
- ✅ Génération de flyers recto-verso
- ✅ Communiqués de presse professionnels
- ✅ Posts pour réseaux sociaux (format carré)
- ✅ Aperçu en temps réel des modifications
- ✅ 8 couleurs Hormur + option noir & blanc
- ✅ Upload et recadrage d'images
- ✅ Interface 100% responsive (mobile-first)

## 🚀 Déploiement

### Via Netlify (automatique)

1. Créer un nouveau site sur Netlify
2. Connecter ce repository GitHub
3. Les paramètres de build sont déjà configurés dans `netlify.toml`
4. Déployer !

### Configuration de build

```toml
Build command: npm run build
Publish directory: dist
```

## 📦 Installation locale (optionnel)

```bash
npm install
npm run dev
```

## 🛠 Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide React (icônes)

## 📝 Structure des fichiers

```
hormur-visual-editor/
├── src/
│   ├── App.jsx          # Composant principal
│   ├── main.jsx         # Point d'entrée
│   └── index.css        # Styles globaux
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── netlify.toml
```

## 🎯 Prochaines étapes (Partie 2)

- [ ] Intégration Stencil pour génération automatique
- [ ] Workflow n8n pour automation
- [ ] Génération de QR codes personnalisés
- [ ] Envoi email/SMS via Brevo
- [ ] Suggestions de titres via OpenAI
- [ ] Système d'abonnement Stripe

---

Développé pour Hormur - La plateforme qui connecte artistes et lieux non conventionnels