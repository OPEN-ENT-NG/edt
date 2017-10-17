package fr.cgi.edt.utils;

public enum EdtWorkflowActions {

    VIEW ("edt.view"),
    CREATE ("edt.create");

    private final String actionName;

    EdtWorkflowActions (String actionName) {
        this.actionName = actionName;
    }

    @Override
    public String toString () {
        return this.actionName;
    }
}
