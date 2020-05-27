package fr.cgi.edt.sts;

public enum StsError {
    // The file system trigger an error when reading the import folder. The folder probably does not exists
    DIRECTORY_READING_ERROR("edt.sts.import.directory.reading.error"),
    // The import process failed on future courses deletion. This stop the entire import process
    DELETE_FUTURE_COURSES_ERROR("edt.sts.import.error.delete.future.courses"),
    // An error occurred on directory creation in the server file system. Check logs
    FOLDER_CREATION_FAILED("edt.sts.import.mkdir.error"),
    // Something wrong happen during import process. The data retrieving process trigger an error
    IMPORT_SERVER_ERROR("edt.sts.import.server.error"),
    // Course insertion failed. It happened while the import process try to insert formatted courses in courses mongo collection
    INSERTION_ERROR("edt.sts.import.insertion.error"),
    // Given files are not xml files OR are not ending with xml extension
    INVALID_FILE_EXTENSION("edt.sts.import.invalid.file.extension"),
    // An error occurred on xml parsing
    PARSING_ERROR("edt.sts.import.parsing.error"),
    // The structure UAI describes in XML files does not exists in the database. Files are probably wrong or the user does not import the right files
    UNKNOWN_STRUCTURE_ERROR("edt.sts.import.unknown.structure"),
    // Unauthorized error. The structure UAI is not the same as the structure identifier provided in http endpoint
    UNAUTHORIZED("edt.sts.import.error.unauthorized"),
    // Something happened during files upload. Check logs
    UPLOAD_FAILED("edt.sts.import.upload.failed");

    private final String key;

    StsError(String key) {
        this.key = key;
    }

    public String key() {
        return this.key;
    }
}
