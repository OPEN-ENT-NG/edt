# À propos de l'application Emploi du temps

* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright CGI
* Financeur(s) : CGI
* Développeur : CGI
* Description : Affichage et modification de l'emploi du temps

## Présentation du module
Le module Emploi du temps permet de gérer l’emploi du temps de l’établissement. Les personnes en charge de la gestion de l’emploi du temps peuvent le modifier, en y ajoutant ou en déplaçant des cours par exemple. Ce module permet également de consulter l’emploi du temps : pour les gestionnaires, cette application permet une visualisation globale ou ciblée sur une classe. Les élèves ont accès à l’emploi du temps de leur classe.

## Configuration
<pre>
  {
      "config": {
      ...
        "holidays": {
            "public-holidays": "${publicHolidays}",
            "school-holidays": "${schoolHolidays}"
        },
       ...
      }
    }
</pre>

Dans votre springboard, vous devez inclure des variables d'environnement :
<pre>
publicHolidays=${String}
schoolHolidays=${String}

publicHolidays=https://calendrier.api.gouv.fr
schoolHolidays=https://data.education.gouv.fr
</pre>
Il est nécessaire de mettre ***edt:true*** dans services du module vie scolaire afin de paramétrer les données de configuration d'Emploi du temps.
<pre>
"services": {
     ...
     "edt": true,
     ...
 }
</pre>

## Développement local (watcher + proxy vers une recette distante)

Ce mode permet de développer le frontend TypeScript/AngularJS sans installer le backend en local : le bundle TS (webpack via gulp) et la feuille de style (sass) sont rebuildés à la volée et servis localement, tandis que tout le reste (page `/edt`, `ng-app.js`, thème, API) est proxifié vers une recette distante avec la session de l'utilisateur connecté. Le navigateur recharge tout seul à chaque changement de `.ts` ou de template, et les `.scss` sont injectés à chaud sans rechargement de page.

1. `yarn install`
2. `cp .env.template .env` (une fois — rend le module détectable par `dev-auth-fetcher`)
3. `dev-auth-fetcher connect` (option `--watch` pour garder la session active) — ou le skill Claude `auth-user-frontend` — pour remplir `.env` (`VITE_RECETTE`, `VITE_XSRF_TOKEN`, `VITE_ONE_SESSION_ID`)
4. `yarn dev` → ouvre `http://localhost:3000/edt` (et PAS HTTPS)

`yarn dev` lance trois processus en parallèle (préfixes `webpack`, `sass`, `serve` dans la console) : le rebuild du bundle, la compilation du sass, et le serveur local.

### Le cas particulier du sass

La CSS de l'application n'est pas produite par le build de ce dépôt : elle est compilée dans le `theme.css` du skin (projet **ode-themes**), que la recette sert et que `ng-app.js` ajoute au `<head>` à l'exécution. Rien ne demande donc jamais de CSS locale.

Pour pouvoir tout de même voir une modification de sass sans redéployer un thème, `yarn dev` compile `sass/index.scss` vers `public/css/edt.css` (gitignoré, jamais déployé), et le serveur local injecte un `<link>` vers ce fichier juste après celui du thème — à spécificité égale, c'est le dernier de la cascade qui gagne.

**Le rendu est indicatif** : les variables viennent de l'`entcore-css-lib` par défaut, pas du skin réellement déployé sur la recette. Les écarts de couleurs ou d'espacements sont donc normaux ; seule la structure de vos règles est fiable. La validation finale se fait après build du thème.

Commandes utiles :
- `yarn watch:sass` — compilation en continu seule (déjà incluse dans `yarn dev`)
- `yarn build:sass` — compilation ponctuelle, utile pour vérifier qu'une modification de sass compile

À savoir :
- La vue HTML de `/edt` (`view/edt.html`) est celle déployée sur la recette distante : une modification locale de `view-src/` ne s'y reflète pas.
- Si la console affiche `css/edt.css not built yet`, c'est que le sass n'a pas encore compilé une première fois : le style local est pris en compte au chargement de page suivant, sans redémarrage.
- Une session expirée se manifeste par une redirection vers `/auth/login` : le serveur la signale explicitement dans la console. Relancez `dev-auth-fetcher connect` puis `yarn dev`.
- Si un dossier `src/main/resources/public/template/entcore` traîne d'un ancien build, supprimez-le (`rm -rf src/main/resources/public/template/entcore`) pour que ces templates viennent bien de la recette et non d'une version locale obsolète.
- Pour tester l'intégration Screeb en local sans dépendre de la conf de la recette, renseignez `SCREEB_APP_ID_DEV` dans `.env` : `/edt/conf/public` est alors mocké localement avec cet app id.
