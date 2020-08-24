package fr.cgi.edt.sts;

import fr.cgi.edt.sts.bean.*;
import io.vertx.core.json.JsonArray;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.xml.sax.Attributes;
import org.xml.sax.helpers.DefaultHandler;

import java.text.ParseException;

import static fr.cgi.edt.sts.StsFields.*;

public class StsHandler extends DefaultHandler {

    private final StsCache cache;
    private Alternation alternation;
    private Audience audience;
    private Course course;
    private Service service;
    private Subject subject;
    private Teacher teacher;

    private String tagName;
    private Logger log = LoggerFactory.getLogger(StsHandler.class);

    public StsHandler(StsCache cache) {
        this.cache = cache;
    }

    @Override
    public void startElement(String uri, String localName, String qName, Attributes attributes) {
        tagName = localName;
        switch (localName) {

            case ALTERNANCE:
                alternation = new Alternation(attributes.getValue(CODE));
                break;

            case DIVISION:
                audience = new Audience(AudienceType.CLASS, attributes.getValue(CODE).trim());
                break;

            case ENSEIGNANT:
                if (service != null) service.setTeacher(attributes.getValue(ID));
                break;

            case GROUPE:
                audience = new Audience(AudienceType.GROUP, attributes.getValue(CODE).trim());
                break;
            case COURS:
                course = new Course()
                        .setServiceCode(service.code())
                        .setStsTeacher(service.teacher());

                if (AudienceType.CLASS.equals(audience.type())) {
                    course.setClasses(new JsonArray().add(audience.name()));
                    cache.addAudience(audience.name());
                } else if (AudienceType.GROUP.equals(audience.type())) {
                    course.setGroups(new JsonArray().add(audience.name()));
                    cache.addAudience(audience.name());
                } else {
                    log.error("Neither classes nor groups found in the course object");
                }
                break;
            case SERVICE:
                service = new Service().setCode(attributes.getValue(CODE_MATIERE).trim());
                break;

            case MATIERE:
                subject = new Subject().setCode(attributes.getValue(CODE).trim());
                break;

            case INDIVIDU:
                teacher = new Teacher().setId(attributes.getValue(ID).trim());
                break;
        }
    }


    public void characters(char ch[], int start, int length) {
        String value = new String(ch, start, length).trim();
        if ("".equals(value)) return;
        switch (tagName) {
            case UAJ:
                cache.setUai(value);
                break;
            case DATE_DEBUT_SEMAINE:
                if (alternation != null) {
                    try {
                        Week week = new Week(value);
                        if (week.isFutureOrCurrentWeek()) alternation.putWeek(week);
                    } catch (ParseException e) {
                        log.error("Failed to parse week value");
                    }
                }
                break;
            case CODE_ALTERNANCE:
                if (course != null) course.setAlternation(value);
                break;
            case JOUR:
                if (course != null) course.setDayOfWeek(value);
                break;
            case HEURE_DEBUT:
                if (course != null) course.setStartTime(value);
                break;
            case DUREE:
                if (course != null) course.setDuration(value);
                break;
            case CODE_SALLE:
                if (course != null) course.setRoom(value);
                break;
            case LIBELLE_COURT:
                if (subject != null) subject.setName(value);
                if (alternation != null) alternation.setLabel(value);
                break;
            case NOM_USAGE:
                if (teacher != null) teacher.setLastName(value);
                break;
            case PRENOM:
                if (teacher != null) teacher.setFirstName(value);
                break;
            case DATE_NAISSANCE:
                if (teacher != null) teacher.setBirthDate(value);
                break;

        }
    }


    @Override
    public void endElement(String uri, String localName, String qName) {
        switch (localName) {
            case ALTERNANCE:
                if (alternation != null && !alternation.weeks().isEmpty()) cache.addAlternation(alternation);
                alternation = null;
                break;
            case COURS:
                if (course != null) cache.addCourse(course);
                course = null;
                break;
            case DIVISION:
            case GROUPE:
                audience = null;
                break;
            case MATIERE:
                if (subject != null) cache.addSubject(subject);
                break;
            case INDIVIDU:
                if (teacher != null && teacher.valid()) cache.addTeacher(teacher);
                teacher = null;
                break;
        }
        tagName = null;
    }
}
