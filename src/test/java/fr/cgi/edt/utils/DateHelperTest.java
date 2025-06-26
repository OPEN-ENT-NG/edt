package fr.cgi.edt.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class DateHelperTest {
    @Test
    void testGetAdjustedHolidaysStartDate_SameStartAndEndDate() {
        String startAt = "2025-05-28 22:00:00";
        String endDate = "2025-05-28 22:00:00";

        String result = DateHelper.getAdjustedHolidaysStartDate(startAt, endDate);

        assertEquals(startAt, result, "Expected the same date when startAt equals endDate");
    }

    @Test
    void testGetAdjustedHolidaysStartDate_After20() {
        String startAt = "2025-05-28 22:00:00";
        String endDate = "2025-05-29 00:00:00";

        String result = DateHelper.getAdjustedHolidaysStartDate(startAt, endDate);

        assertEquals("2025-05-29 00:00:00", result, "Expected the date to be adjusted to the next day at 00:00:00");
    }

    @Test
    void testGetAdjustedHolidaysStartDate_Before20() {
        String startAt = "2025-05-28 19:00:00";
        String endDate = "2025-05-29 00:00:00";

        String result = DateHelper.getAdjustedHolidaysStartDate(startAt, endDate);

        assertEquals(startAt, result, "Expected the same date when startAt is before 20:00:00");
    }
}
