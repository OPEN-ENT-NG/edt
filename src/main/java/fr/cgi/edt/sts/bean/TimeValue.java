package fr.cgi.edt.sts.bean;

public enum TimeValue {
    HOUR(0),
    MIN(1);

    private final Integer value;

    TimeValue(Integer value) {
        this.value = value;
    }

    public Integer value() {
        return this.value;
    }
}
