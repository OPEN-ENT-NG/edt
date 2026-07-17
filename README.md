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

Ce mode permet de développer le frontend TypeScript/AngularJS sans installer le backend en local : le bundle est rebuildé à la volée (webpack via gulp) et servi localement, tandis que tout le reste (page `/edt`, `ng-app.js`, thème, API) est proxifié vers une recette distante avec la session de l'utilisateur connecté. Auto-reload du navigateur à chaque changement.

1. `npm install`
2. `cp .env.template .env` (une fois — rend le module détectable par `dev-auth-fetcher`)
3. `dev-auth-fetcher connect` (option `--watch` pour garder la session active) — ou le skill Claude `auth-user-frontend` — pour remplir `.env` (`PROXY_RECETTE`, `PROXY_XSRF_TOKEN`, `PROXY_ONE_SESSION_ID`)
4. `npm run dev` → ouvre `http://localhost:3000/edt`

À savoir :
- La vue HTML de `/edt` (`view/edt.html`) est celle déployée sur la recette distante : une modification locale de `view-src/` ne s'y reflète pas.
- Si un dossier `src/main/resources/public/template/entcore` traîne d'un ancien build, supprimez-le (`rm -rf src/main/resources/public/template/entcore`) pour que ces templates viennent bien de la recette et non d'une version locale obsolète.
