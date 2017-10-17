import { ng, _, model, moment, notify } from 'entcore';
import { DAYS_OF_WEEK, COMBO_LABELS, Teacher, Group, CourseOccurrence, Utils, Course } from '../model';

export let creationController = ng.controller('CreationController',
    ['$scope', function ($scope) {
        $scope.daysOfWeek = DAYS_OF_WEEK;
        $scope.comboLabels = COMBO_LABELS;

        $scope.validation = {
            step1: true,
            step2: true
        };

        $scope.addingCourse = false;

        /**
         * Drop a teacher in teachers list
         * @param {Teacher} teacher Teacher to drop
         */
        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.course.teachers = _.without($scope.course.teachers, teacher);
        };

        /**
         * Drop a group in groups list
         * @param {Group} group Group to drop
         */
        $scope.dropGroup = (group: Group): void => {
            $scope.course.groups = _.without($scope.course.groups, group);
        };

        /**
         * Close lightbox and delete the course.
         */
        $scope.closeCreateWindow = (): void => {
            delete $scope.course;
            $scope.goTo('/');
        };

        /**
         * Adding a course occurrence. Create a new course Occurrence and open the lightbox.
         */
        $scope.addCourseOccurrence =  (): void => {
            $scope.courseOccurrence = new CourseOccurrence();
            $scope.addingCourse = true;
        };

        /**
         * Drop a course occurrence from the table
         * @param {CourseOccurrence} occurrence Course occurrence to drop.
         */
        $scope.dropOccurrence = (occurrence: CourseOccurrence): void => {
            $scope.course.courseOccurrences = _.without($scope.course.courseOccurrences, occurrence);
        };

        /**
         * Create a course occurrence
         */
        $scope.createCourseOccurrence = (): void => {
            $scope.course.courseOccurrences.push($scope.courseOccurrence);
            $scope.addingCourse = false;
        };

        /**
         * Validating course creation with occurrences.
         * @returns {Promise<void>} Returns a Promise
         */
        $scope.validCreationOccurrence = async (): Promise<void> => {
            await $scope.structure.courses.create($scope.course);
            $scope.goTo('/');
            $scope.getTimetable();
        };

        /**
         * Function canceling course creation
         */
        $scope.cancelCreation = () => {
            $scope.goTo('/');
            delete $scope.course;
        };

        /**
         * Returns time formatted
         * @param date Date to format
         */
        $scope.getTime = (date: any) => {
            return moment(date).format("HH:mm");
        };

        /**
         * Save course based on parameter
         * @param {Course} course course to save
         * @returns {Promise<void>} Returns a promise
         */
        $scope.saveCourse = async (course: Course): Promise<void>  => {
            if (course._id) {
                let coursesToSave = [];
                let occurrences = _.where($scope.structure.courses.all, {_id: course._id});
                if (occurrences.length === 0) {
                    notify.error('edt.notify.update.err');
                    return;
                } else if (occurrences.length === 1) {
                    coursesToSave.push(Utils.cleanCourseForSave(course));
                } else {
                    let originalCourse = _.findWhere($scope.structure.courses.origin, { _id: course._id });
                    delete course._id;
                    coursesToSave = Utils.splitCourseForUpdate(course, new Course(originalCourse, originalCourse.startDate, originalCourse.endDate));
                }
                await $scope.structure.courses.update(coursesToSave);
            } else {
                await course.save();
            }
            $scope.lightbox.hide();
            delete $scope.course;
            $scope.getTimetable();
        };

        /**
         * Function that validate form before step 2 activation
         * @returns {boolean} step 1 validation state
         */
        $scope.validateStep1 = () => {
            $scope.validation.step1 = $scope.course.teachers.length > 0
                && $scope.course.groups.length > 0
                && $scope.course.subjectId !== undefined;
            return $scope.validation.step1;
        };

        /**
         * Function that validate form before step 3 activation
         * @returns {boolean} step 2 validation state
         */
        $scope.validateStep2 = () => {
            return ($scope.validation.step2 = $scope.course.courseOccurrences.length > 0);
        };

        /**
         * Function that validate form before finishing stepper
         * @returns {boolean} step 3 validation state
         */
        $scope.validateStep3 = () => {
            return true;
        };

        /**
         * Function triggered on step 3 activation
         */
        $scope.step3Activation = () => {
            console.log('step3 activation');
            $scope.course.overviewCourses = [];
            for (let i = 0; i < $scope.course.courseOccurrences.length; i++) {
                let occurrence = $scope.course.courseOccurrences[i];
                occurrence.structureId = $scope.course.structureId;
                occurrence.subjectId = $scope.course.subjectId;
                occurrence.teacherIds = Utils.getValues($scope.course.teachers, 'id');
                occurrence.classes = Utils.getValues(_.where($scope.course.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS']}), 'name');
                occurrence.groups = Utils.getValues(_.where($scope.course.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP']}), 'name');
                occurrence.startDate = Utils.getOccurrenceDateForOverview($scope.course.startDate, occurrence.startTime, occurrence.dayOfWeek);
                occurrence.endDate = Utils.getOccurrenceDateForOverview($scope.course.startDate, occurrence.endTime, occurrence.dayOfWeek);
                occurrence.dayOfWeek = parseInt(occurrence.dayOfWeek);
                $scope.course.overviewCourses.push(new Course(occurrence, occurrence.startDate, occurrence.endDate));
            }
            $scope.course.overviewCourses = Utils.formatCourses($scope.course.overviewCourses, $scope.structure);
            console.log($scope.course.overviewCourses);
        };
    }]
);