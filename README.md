# ALORIA — V1

Prototype mobile du RPG Aloria, compatible GitHub Pages. Les fichiers sont autonomes et organisés en modules :

- `index.html` : structure et navigation
- `css/style.css` : style mobile et fenêtre gothique
- `js/data.js` : mondes, statistiques, objets, valeurs initiales
- `js/main.js` : interactions des onglets
- `js/firebase.js` : connexion anonyme et sauvegardes Firestore
- `assets/` : illustration de ville et portraits provisoires
- `firestore.rules` : règles de sécurité à copier dans Firebase

## Publication sur GitHub Pages

1. Décompresser l'archive et placer **le contenu du dossier** à la racine du dépôt GitHub `Latem09/Aloria` (le fichier `index.html` doit être à la racine).
2. Sur GitHub : **Settings > General > Danger Zone > Change repository visibility > Public**. Cela rend le **code public**, pas les sauvegardes Firestore.
3. Dans **Settings > Pages**, choisir **Deploy from a branch**, `main`, `/ (root)`, puis **Save**.
4. Patienter quelques minutes. URL attendue : `https://latem09.github.io/Aloria/`.
5. Dans Firebase > Authentication > Settings > Authorized domains, ajouter `latem09.github.io` si absent, pour permettre la connexion anonyme depuis GitHub Pages.
6. Dans Firebase > Firestore Database > Rules, remplacer les règles par le contenu de `firestore.rules` puis publier. **Ne pas modifier les règles de CULTURE ARENA**.

## Important

- Ne pas mettre Firestore en mode test ouvert au public.
- Firebase Authentication **Anonyme** doit être activé dans le projet **Aloria**.
- Les avatars 2 à 6 sont des variations colorées provisoires du premier portrait, à remplacer par six illustrations originales ultérieurement.
- Les équipements de départ sont des exemples pour démontrer l'interface. Les combats, les effets des objets, le commerce, la forge, les niveaux supplémentaires et le classement ne sont pas encore jouables.
- Le personnage reçoit 1 point par niveau **gagné** ; avec 8 statistiques à 10 crans, les 80 points sont atteints au niveau **81** si l'on commence au niveau 1 sans point.
- Le pseudo n'est pas un identifiant de connexion. Les sauvegardes anonymes sont liées au navigateur et peuvent devenir inaccessibles si ses données sont effacées ou si l'on change d'appareil. Un système de récupération est à prévoir avant d'y consacrer de longues parties.
- Les sauvegardes sont protégées par utilisateur, mais la V1 ne comporte pas de logique serveur anti-triche.

## Tester en local

Les modules JavaScript doivent être servis par un serveur Web (pas directement en ouvrant `file://`). Une fois publié sur GitHub Pages, le site fonctionnera normalement.
