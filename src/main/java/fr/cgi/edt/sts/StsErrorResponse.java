package fr.cgi.edt.sts;

public class StsErrorResponse {

    // Given files are not xml files OR are not ending with xml extension
    public static final String INVALID_FILE_EXTENSION = "invalid.file.extension";

    // An error occurred on directory creation in the server file system. Check logs
    public static final String FOLDER_CREATION_FAILED = "mkdir.error";

    // Something happened during files upload. Check logs
    public static final String UPLOAD_FAILED = "upload.failed";

    // An error occurred on xml parsing
    public static final String PARSING_ERROR = "edt.sts.import.parsing.error";

    // Course insertion failed. It happened while the import process try to insert formatted courses in courses mongo collection
    public static final String INSERTION_ERROR = "edt.sts.import.insertion.error";

    // The file system trigger an error when reading the import folder. The folder probably does not exists
    public static final String DIRECTORY_READING_ERROR = "edt.sts.import.directory.reading.error";

    // Something wrong happen during import process. The data retrieving process trigger an error
    public static final String IMPORT_SERVER_ERROR = "edt.sts.import.server.error";

    // The structure UAI describes in XML files does not exists in the database. Files are probably wrong or the user does not import the right files
    public static final String UNKNOWN_STRUCTURE_ERROR = "edt.sts.import.unknown.structure";

    // The import process failed on future courses deletion. This stop the entire import process
    public static final String DELETE_FUTURE_COURSES_ERROR = "edt.sts.import.error.delete.future.courses";

    // Unauthorized error. The structure UAI is not the same as the structure identifier provided in http endpoint
    public static final String UNAUTHORIZED = "401";
}
