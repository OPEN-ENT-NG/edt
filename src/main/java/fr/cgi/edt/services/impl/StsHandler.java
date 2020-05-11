package fr.cgi.edt.services.impl;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import static fr.cgi.edt.sts.STSFields.*;
import static fr.wseduc.webutils.Utils.isNotEmpty;

public class StsHandler extends DefaultHandler {

    private String currentTag = "";
    private String currentEntityType = "";
    private JsonObject currentEntity;
    private final StsServiceImpl stsServiceImpl;

    private String buffer;
    private String UAI;
    private String fileType;
    private String currentAlternance;
    //private String currentDivision;
    //private String currentGroupe;
    private String currentService;
    private String currentTeacher;
    private String currentMatiere;
    private String currentIndividuId;
    private String coens;
    private String currentCodeAlternance;
    private String jour;
    private String heure;
    private String duree;
    private String currentRegroupement;
    private String divisionAppartenance;

    private int nbSemaines = 0;
    private int nbMatiere = 0;
    private int cmptCourses = 0;
    private int cmptEns = 0;
    private int cmptAppartenance = 0;

    private JsonObject alternanceMapping;
    private JsonObject matiereMapping;
    private JsonObject individuMapping;
    private JsonObject finalCourse;
    private JsonArray tmpTeachers;
    private JsonArray tmpAppartenances;
    private JsonArray tmpMapping;
    private JsonArray teachers;
    private JsonArray appartenances;
    private JsonArray currentDivision;
    private JsonArray currentGroupe;



    public StsHandler(StsServiceImpl stsServiceImpl) {
        this.stsServiceImpl = stsServiceImpl;
    }

    @Override
    public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
        currentTag = localName;
        final JsonObject o = attributesToJsonObject(attributes);
        if (isNotEmpty(currentEntityType)) {
            JsonArray a = currentEntity.getJsonArray(currentTag);
            if (a == null) {
                a = new fr.wseduc.webutils.collections.JsonArray();
                currentEntity.put(currentTag, a);
            }
            a.add(o);
            return;
        }

        switch (localName) {

            case EDT_STS:
                fileType = "EDT_STS";
                break;
            case STS_EDT:
                fileType = "STS_EDT";
                break;


            case ALTERNANCE:
                currentEntityType = localName;
                currentEntity = o;
                alternanceMapping = new JsonObject();
                tmpMapping = new JsonArray();
                break;

            case DIVISION:
                currentEntityType = localName;
                currentEntity = o;
                currentDivision = new JsonArray();
                currentDivision.add(currentEntity.getString(CODE));
                currentRegroupement = DIVISION;
                break;

            case GROUPE:
                currentEntityType = localName;
                currentEntity = o;
                currentGroupe = new JsonArray();
                currentGroupe.add(currentEntity.getString(CODE));
                currentRegroupement = GROUPE;
                break;

            case MATIERE:
                currentEntityType = localName;
                currentEntity = o;
                matiereMapping = new JsonObject();
                currentMatiere = currentEntity.getString(CODE);
                matiereMapping.put("code_matiere", currentMatiere);
                break;

            case INDIVIDU:
                currentEntityType = localName;
                currentEntity = o;
                individuMapping = new JsonObject();
                currentIndividuId = currentEntity.getString(ID);
                individuMapping.put("id", currentIndividuId);
                break;
        }
    }


    public void characters (char ch[], int start, int length) throws SAXException {

        switch (currentTag) {
            case UAJ:
                if(length > 1) {
                    UAI = new String(ch, start, length);
                    stsServiceImpl.addCodeUAI(UAI);
                }
                break;
            case DATE_DEBUT_SEMAINE:
                JsonObject t = new JsonObject();
                nbSemaines += 1;
                buffer = new String(ch, start, length);
                t.put("semaine", buffer);
                tmpMapping.add(t);
                break;

            case DIVISIONS_APPARTENANCE:
                tmpAppartenances = new JsonArray();
                appartenances = new JsonArray();
                break;

            case DIVISION_APPARTENANCE:
                // In case of group entity type, break. Otherwise the course contains group and class
                if (GROUPE.equals(currentEntityType)) break;
                String tmpAppartenance = currentEntity.getJsonArray(currentTag).getJsonObject(cmptAppartenance).getString(CODE);
                if (divisionAppartenance != tmpAppartenance) {
                    tmpAppartenances.add(tmpAppartenance);
                    cmptAppartenance += 1;
                    divisionAppartenance = tmpAppartenance;

                }
                break;

            case SERVICE:
                currentService = currentEntity.getJsonArray(currentTag).getJsonObject(cmptCourses).getString(CODE_MATIERE);
                cmptCourses += 1;
                break;

            case CO_ENS:
                coens = new String(ch, start, length);
                break;

            case ENSEIGNANTS:
                teachers = new JsonArray();
                break;

            case ENSEIGNANT:
                tmpTeachers = new JsonArray(); // TODO voir pour déplacer dans case ENSEIGNANTS (plus coherent)
                String tmpTeacher = currentEntity.getJsonArray(currentTag).getJsonObject(cmptEns).getString(ID);
                if (currentTeacher != tmpTeacher) {
                    cmptEns += 1;
                    tmpTeachers.add(tmpTeacher);
                    currentTeacher = tmpTeacher;
                }
                break;

            case COURS:
                //cours = new JsonObject();
                finalCourse = new JsonObject();
                break;

            case CODE_ALTERNANCE:
                buffer = new String(ch, start, length);
                currentCodeAlternance = buffer;
                break;

            case JOUR:
                jour = new String(ch, start, length);
                break;

            case HEURE_DEBUT:
                heure = new String(ch, start, length);
                break;

            case DUREE:
                duree = new String(ch, start, length);

                finalCourse.put("uai",UAI);
                if (DIVISION.equals(currentRegroupement)) {
                    finalCourse.put("divisions",currentDivision);
                } else if (GROUPE.equals(currentRegroupement)) {
                    finalCourse.put("groupes", currentGroupe);
                    if (tmpAppartenances != null) {
                        finalCourse.put("divisions", tmpAppartenances);
                    }
                } else {
                    // TODO error message
                }
                finalCourse.put("duree",duree);
                break;
            case CODE_SALLE:
                finalCourse.put("salle", duree = new String(ch, start, length));
                finalCourse.put("service", currentService);
                finalCourse.put("teachers", tmpTeachers);
                finalCourse.put("codeAlternance", currentCodeAlternance);
                finalCourse.put("jour", jour);
                finalCourse.put("heure_debut", heure);
                stsServiceImpl.addCourse(finalCourse);
                break;
            case LIBELLE_COURT:
                if (currentEntityType.equals(MATIERE)){
                    nbMatiere +=1;
                    buffer = new String(ch, start, length);
                    matiereMapping.put("matiere", buffer);
                }
                break;

            case NOM_USAGE:
                buffer = new String(ch, start, length);
                individuMapping.put("nom", buffer);
                break;

            case PRENOM:
                buffer = new String(ch, start, length);
                individuMapping.put("prenom", buffer);
                break;

            case DATE_NAISSANCE:
                buffer = new String(ch, start, length);
                individuMapping.put("date_naissance", buffer);
                break;

        }
    }



    private JsonObject attributesToJsonObject(Attributes attributes) {
        final JsonObject j = new JsonObject();
        for (int i = 0; i < attributes.getLength(); i++) {
            j.put(attributes.getLocalName(i), attributes.getValue(i));
        }
        return j;
    }

    @Override
    public void endElement(String uri, String localName, String qName) throws SAXException {
        super.endElement(uri, localName, qName);
        currentTag = "";
        if (localName.equals(currentEntityType)) {
            currentEntityType = "";
            switch (localName) {
                case ALTERNANCE:
                    currentAlternance = currentEntity.getString(CODE);
                    alternanceMapping.put("code", currentAlternance);
                    alternanceMapping.put("semaines", tmpMapping);
                    stsServiceImpl.addAlternanceTable(alternanceMapping);
                    break;

                case DIVISION:
                    cmptCourses = 0;
                    cmptEns = 0;
                    break;
                case GROUPE:
                    cmptCourses = 0;
                    cmptEns = 0;
                    cmptAppartenance = 0;
                    break;

                case MATIERE:
                    stsServiceImpl.addMatieresTable(matiereMapping);
                    break;

                case INDIVIDU:
                    stsServiceImpl.addIndividusTable(individuMapping);
                    break;
            }
            currentEntity = null;
        }
    }

}
