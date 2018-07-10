import { ng, _, model, moment, notify } from 'entcore';
import { DAYS_OF_WEEK, COMBO_LABELS, Teacher, Group, CourseOccurrence, Utils, Course } from '../model';

export let creationController = ng.controller('CreationController',
    ['$scope', '$location','$routeParams',  ($scope, $location, $routeParams) => {

        $scope.daysOfWeek = DAYS_OF_WEEK;
        $scope.comboLabels = COMBO_LABELS;
        $scope.courseOccurrenceForm = new CourseOccurrence(); //Init courseOccurrence needed for the table form
        $scope.isAnUpdate = false;
        $scope.is_recurrent = false;
        /**
         * Init Courses
         */

        if ($location.$$path.includes('/edit')) {
            /**
             * Init Form with data form an update
             */
            $scope.isAnUpdate = true;
            $scope.is_recurrent  = Utils.isRecurent($scope.course.startCourse,$scope.course.endCourse);

            $scope.course.courseOccurrences = [];
            $scope.course.teachers = [];
            for (let i = 0; i < $scope.course.teacherIds.length; i++) {
                let teacher = _.findWhere($scope.structure.teachers.all, {id: $scope.course.teacherIds[i]});
                if(teacher) $scope.course.teachers.push(teacher);
            }
            let groups = $scope.course.groups;
            $scope.course.groups = [];
            for (let i = 0; i < groups.length; i++) {
               let group = _.findWhere($scope.structure.groups.all, {name: groups[i]});
               if(group) $scope.course.groups.push(group);
            }
            for (let i = 0; i < $scope.course.classes.length; i++) {
                let classe = _.findWhere($scope.structure.groups.all, {name: $scope.course.classes[i]});
               if(classe) $scope.course.groups.push(classe);
            }

            if ($scope.is_recurrent) {
                if ( $scope.course.dayOfWeek &&  $scope.course.startDate &&  $scope.course.endDate) {
                    $scope.course.courseOccurrences = [
                        new CourseOccurrence(
                            $scope.course["dayOfWeek"],
                            $scope.course.roomLabels[0],
                            new Date( $scope.course.startCourse),
                            new Date( $scope.course.endCourse)
                        )
                    ];
                }
            }
            if ($routeParams['start'] && $routeParams['end'] ){
                $scope.courseOccurrenceForm.startTime =  moment( $routeParams.start, 'x').seconds(0).millisecond(0).toDate();
                $scope.courseOccurrenceForm.endTime =  moment( $routeParams.end, 'x').seconds(0).millisecond(0).toDate();
                $scope.courseOccurrenceForm.dayOfWeek = moment( $routeParams.start, 'x').day();
            }
            else{
                let start =  moment( $scope.course.beginning).seconds(0).millisecond(0);
                start = start.add((15 - (start.minute() % 15)), "minutes");

                $scope.courseOccurrenceForm.startTime =  start.toDate();
                let end = start.seconds(0).milliseconds(0).add(1, 'hours').format('x');
                $scope.courseOccurrenceForm.endTime = new Date();
                $scope.courseOccurrenceForm.endTime.setTime(end);
                $scope.courseOccurrenceForm.dayOfWeek = moment( $scope.course.beginning).day();
            }

            $scope.courseOccurrenceForm.roomLabels =  ($scope.course.roomLabels) ? [$scope.course["roomLabels"][0]] :  [];
            Utils.safeApply($scope);
        }
        else {
            if ($scope.params.group)
                $scope.course.groups.push($scope.params.group);

            if ($scope.params.user)
                $scope.course.teachers.push($scope.params.user);

            if ($scope.structures.all.length === 1)
                $scope.course.structureId = $scope.structure.id;
        }

        if ($scope.params.dateFromCalendar) {
            let dateFromCalendar = $scope.params.dateFromCalendar;
            $scope.params.dateFromCalendar = null;
            $scope.courseOccurrenceForm.startTime = dateFromCalendar.beginning.seconds(0).millisecond(0).toDate();
            $scope.courseOccurrenceForm.endTime = dateFromCalendar.end.seconds(0).millisecond(0).toDate();
            $scope.courseOccurrenceForm.dayOfWeek = dateFromCalendar.beginning.day();
        }

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
         * Drop a course occurrence from the table
         * @param {CourseOccurrence} occurrence Course occurrence to drop.
         */
        $scope.dropOccurrence = (occurrence: CourseOccurrence): void => {
            $scope.course.courseOccurrences = _.without($scope.course.courseOccurrences, occurrence);
        };

        /**
         * Create a course occurrence
         */
        $scope.submit_CourseOccurrence_Form = (): void => {
            $scope.changeDate();
            $scope.course.courseOccurrences.push(_.clone($scope.courseOccurrenceForm));
            $scope.courseOccurrenceForm = new CourseOccurrence();
        };

        /**
         * Function canceling course creation
         */
        $scope.cancelCreation = () => {
            delete $scope.course;
            $scope.goTo('/');

        };

        /**
         * Returns time formatted
         * @param date Date to format
         */
        $scope.getTime = (date: any) => {
            return moment(date).format("HH:mm");
        };

        /**
         *
         */
        $scope.changeDate = () => {

            let startDate = moment($scope.course.startDate).format("YYYY-MM-DD"),
                startTime = moment($scope.courseOccurrenceForm.startTime).format("HH:mm:ss"),
                endDate = moment($scope.course.endDate).format("YYYY-MM-DD"),
                endTime = moment($scope.courseOccurrenceForm.endTime).format("HH:mm:ss");

            if (!$scope.is_recurrent)
                endDate = startDate;
            if(!$scope.isValidDate(startDate, endDate)) {
                $scope.validDate = false;
            }
            else{
                $scope.validDate = true;
                $scope.course.startMoment = moment(startDate + 'T' + startTime);
                $scope.course.endMoment = moment(endDate + 'T' + endTime);
                $scope.courseOccurrenceForm.startTime =  ($scope.course.startMoment.toDate());
                $scope.courseOccurrenceForm.endTime = ($scope.course.endMoment.toDate());

                $scope.course.courseOccurrences = _.map($scope.course.courseOccurrences, (item)=> {
                    let startTime = moment(item.startTime).format("HH:mm:ss"),
                        endTime = moment(item.endTime).format("HH:mm:ss");
                    item.startTime = moment(startDate + 'T' + startTime).toDate();
                    item.startMoment = moment(startDate + 'T' + startTime);
                    item.endTime = moment(endDate + 'T' + endTime).toDate();
                    item.endMoment = moment(endDate + 'T' + endTime);
                    return item;
                });
            }


        };

        $scope.isValidDate = (start , end ) => {
            return moment(start).diff(moment(end)) < 0;
        };

        $scope.validDate = $scope.isValidDate($scope.course.startDate, $scope.course.endDate);

        /**
         *
         * Save course based on parameter
         * @param {Course} course course to save
         * @returns {Promise<void>} Returns a promise
         */
        $scope.saveCourse = async (course: Course): Promise<void>  => {
            $scope.form_is_not_valid = !$scope.isValidForm();

            if (!$scope.is_recurrent) {
                $scope.course.courseOccurrences = [];
                $scope.courseOccurrenceForm.dayOfWeek = moment($scope.course.startDate).day();
                $scope.submit_CourseOccurrence_Form();
            }
            if (course._id) {
                let coursesToSave = [];
                if (course.courseOccurrences.length === 0) {
                    notify.error('edt.notify.update.err');
                    return;
                } else if (course.courseOccurrences.length === 1) {
                    course = Utils.cleanCourseValuesWithFirstOccurence(course);
                    coursesToSave.push(Utils.cleanCourseForSave(course));
                } else {
                    /**
                     * course va contenir une seule occurence pour mettre à jour le cours
                     * NewCourses va contenir 1 ou plusieurs occurence(s) qui seront des créations du ou des nouveau(x) cours
                     */
                    let newCourses = _.clone(course);
                    newCourses.courseOccurrences = _.map(course.courseOccurrences, _.clone);
                    delete newCourses._id; // provoque la création
                    newCourses.courseOccurrences.shift(); // la première occurence sera dans la mise a jour
                    course.courseOccurrences = [course.courseOccurrences[0]]; // on enlève les occurences qui seront créées via newCourses
                    course = Utils.cleanCourseValuesWithFirstOccurence(course);
                    coursesToSave.push(Utils.cleanCourseForSave(course));
                    // not working coursesToSave.push(Utils.cleanCourseForSave(newCourses));
                    await $scope.structure.courses.create(newCourses);
                }

                await $scope.structure.courses.update(coursesToSave);
            } else {
                await $scope.structure.courses.create(course);
            }
            delete $scope.course;
            $scope.goTo('/');
        };

        /**
         * Function triggered on step 3 activation
         */
        $scope.isValidForm = () => {

            return $scope.course
                && $scope.course.teachers
                && $scope.course.groups
                && $scope.course.teachers.length > 0
                && $scope.course.groups.length > 0
                && $scope.course.subjectId !== undefined
                && $scope.validDate
                && (
                    (
                        $scope.is_recurrent
                        && $scope.course.courseOccurrences
                        && $scope.course.courseOccurrences.length > 0
                    )
                    ||
                    (
                        !$scope.is_recurrent
                        && isNaN($scope.courseOccurrenceForm.startTime._d)
                        && isNaN($scope.courseOccurrenceForm.endTime._d)
                    )
                );
        };
        $scope.canDelete = (course: Course) => {
            let now = moment().format("YYYY-MM-DDTHH:mm:ssZ");
            return $scope.isAnUpdate &&
                ( course.startDate >= moment() || ($scope.is_recurrent && course.startDate < moment() && now < course.endDate )
                )
        };

        $scope.dropCourse = async (course: Course ) => {
            if( $scope.canDelete(course) ) {
                await course.delete();
                delete  $scope.course;
                $scope.goTo('/');
                $scope.getTimetable();
            }

        };
    }]
);