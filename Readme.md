# LezckroBot by Gabizoc

LezckroBot est un bot Discord interactif conçu pour animer des discussions sur des dilemmes quotidiens. Il permet aux utilisateurs de voter sur des questions via des boutons interactifs, avec un système de suivi des résultats en temps réel.

## Fonctionnalités principales

- **Questions quotidiennes** : Le bot envoie chaque jour une nouvelle question avec deux options de vote.
- **Réactions emoji** : Les utilisateurs votent en cliquant sur des boutons représentant deux emojis personnalisés.
- **Suivi des résultats** : Les résultats des votes sont affichés sous forme de jauge emoji, indiquant la répartition des votes.
- **Planification automatique** : Les questions sont envoyées automatiquement à une heure définie chaque jour.
- **Gestion des erreurs** : En cas d'erreur, le bot notifie un utilisateur spécifique pour un suivi rapide.

## Prérequis

- Node.js ≥ 18.0.0
- MongoDB pour le stockage des données
- Une application Discord configurée avec un token valide

## Installation

1. Clonez le dépôt :

   ```bash
   git clone https://github.com/Gabizoc/LezckroBot.git
   cd LezckroBot


2. Installez les dépendances :

   ```bash
   npm install
   

3. Créez un fichier `config.json` à la racine du projet avec le contenu suivant :

   ```json
   {
     "token": "VOTRE_TOKEN_DISCORD",
     "dailyChannelId": "ID_DU_SALON",
     "mongodbUri": "URI_MONGODB",
     "status": "Statut du bot",
     "userIdcmd": "ID_UTILISATEUR_AUTORISÉ",
     "errorNotifId": "ID_UTILISATEUR_NOTIF_ERREUR"
   }
   ```

4. Démarrez le bot :

   ```bash
   node index.js
   ```

## Structure du projet

* `index.js` : Le fichier principal contenant la logique du bot.
* `config.json` : Fichier de configuration contenant les paramètres du bot.
* `package.json` : Liste des dépendances et scripts du projet.

## Contribuer

Les contributions sont les bienvenues ! Pour proposer une amélioration ou corriger un bug :

1. Forkez le projet.
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`).
3. Commitez vos modifications (`git commit -am 'Ajout d\'une nouvelle fonctionnalité'`).
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`).
5. Ouvrez une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
