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
