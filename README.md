# À propos de l'application Emploi du temps

* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright CGI
* Financeur(s) : CGI
* Développeur : CGI
* Description : Affichage et modification de l'emploi du temps

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
