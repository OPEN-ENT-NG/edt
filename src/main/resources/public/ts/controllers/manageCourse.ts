import { ng, _,idiom as lang, model, moment, notify } from 'entcore';
import {
    DAYS_OF_WEEK, COMBO_LABELS, Teacher, Group, CourseOccurrence, Utils, Course, Subjects
} from '../model';

export let manageCourseCtrl = ng.controller('manageCourseCtrl',
    ['$scope', '$location','$routeParams',  ($scope, $location, $routeParams) => {

        $scope.daysOfWeek = DAYS_OF_WEEK;
        $scope.comboLabels = COMBO_LABELS;
        $scope.selectionOfTeacherSubject = new Subjects();
        $scope.Utils = Utils;

        $scope.info = {
            firstOccurrenceDate : "",
            firstWeekNumber : "",
            occurrenceInExclusion : false
        };


        $scope.switchStructure = async (structure) => {
            $scope.structure = structure;
            await $scope.structure.sync();
        };

        /**
         * keep the consistency between time of occurrence and dates of course
         */
        $scope.UpToDateInfo = () => {
            let occurrence = moment( $scope.course.startDate);
            if($scope.course.courseOccurrences[0] && $scope.course.courseOccurrences[0].dayOfWeek)
                occurrence.day($scope.course.courseOccurrences[0].dayOfWeek);
            else
                occurrence.day($scope.courseOccurrenceForm.dayOfWeek);
            if( moment( $scope.course.startDate).isAfter(occurrence) )
                occurrence.add('days', 7);
            $scope.info.firstOccurrenceDate = occurrence.format('YYYY/MM/DD');
            $scope.info.firstWeekNumber = occurrence.get('week');
            Utils.safeApply($scope);
        };

        $scope.changeDate = () => {
            let startDate = moment($scope.course.startDate).format("YYYY-MM-DD"),
                startTime = moment($scope.courseOccurrenceForm.startTime).format("HH:mm:ss"),
                endDate = moment($scope.course.endDate).format("YYYY-MM-DD"),
                endTime = moment($scope.courseOccurrenceForm.endTime).format("HH:mm:ss");
            if (!$scope.course.is_recurrent || moment(endDate).diff(moment(startDate), 'days') < 7) {
                endDate = startDate;
                $scope.course.endDate = $scope.course.startDate;
            }
            if(Utils.isValidDate(startDate, endDate)) {
                $scope.courseOccurrenceForm.startTime =  $scope.course.startDate = moment(startDate + 'T' + startTime).toDate();
                $scope.courseOccurrenceForm.endTime = $scope.course.endData = moment(endDate + 'T' + endTime).utc().toDate();

                $scope.course.courseOccurrences = _.map($scope.course.courseOccurrences, (item)=> {
                    let startTime = moment(item.startTime).format("HH:mm:ss"),
                        endTime = moment(item.endTime).format("HH:mm:ss");
                    item.startTime = moment(startDate + 'T' + startTime).toDate();
                    item.endTime = moment(endDate + 'T' + endTime).toDate();
                    return item;
                });
            }
            $scope.UpToDateInfo();
            Utils.safeApply($scope);
        };

        $scope.isExceptionnalSubject = () => {
            if($scope.course.subjectId === lang.translate("exceptionnal.id")){
                return true
            }else{
                return false;
            }
        };
        $scope.syncSubjects = async () => {
            $scope.selectionOfTeacherSubject = new Subjects();
            if ($scope.course.teachers.length > 0) {
                  await $scope.selectionOfTeacherSubject.sync($scope.structure.id, _.pluck($scope.course.teachers, 'id'));
                if(!$scope.course.subjectId && $scope.selectionOfTeacherSubject.all.length && $scope.selectionOfTeacherSubject.all.length > 0)
                    $scope.course.subjectId  = $scope.selectionOfTeacherSubject.all[0].subjectId;

            }
            else {
                $scope.selectionOfTeacherSubject = [];
                $scope.course.subjectId = "";
            }
            Utils.safeApply($scope);
        };


        /**
         * Init Courses
         */

        if ($location.$$path.includes('/edit')) {
            $scope.course.courseOccurrences = [];
            $scope.isAnUpdate = true;
            let start = moment( $scope.course.startDate).seconds(0).millisecond(0),
                end = moment( $scope.course.endDate).seconds(0).millisecond(0);

            if ( $routeParams['beginning'] && $routeParams['end'] ) {
                start = moment( $routeParams.beginning, 'x').seconds(0).millisecond(0);
                end = moment( $routeParams.end, 'x').seconds(0).millisecond(0);
                $scope.courseOccurrenceForm.startTime = moment(start).utc().toDate();
                $scope.courseOccurrenceForm.endTime = moment(end).utc().toDate();
                let startMinutes = moment($scope.course.startDate).minutes() + (60 * moment($scope.course.startDate).hours());
                let endMinutes = moment($scope.course.endDate).minutes() + (60 * moment($scope.course.endDate).hours());

                $scope.courseOccurrenceForm.endTime = moment(start).utc().add(endMinutes - startMinutes,"minutes").toDate();

                $scope.course.dayOfWeek = moment(start).day();

                if (!$scope.course.is_recurrent) {
                    $scope.course.startDate =  $scope.course.end = moment(start).utc().toDate() ;
                }
            }

            if ($scope.course.is_recurrent) {
                if ( $scope.course.dayOfWeek &&  $scope.course.startDate &&  $scope.course.endDate) {
                    $scope.course.courseOccurrences = [
                        new CourseOccurrence(
                            $scope.course.dayOfWeek,
                            $scope.course.roomLabels[0],
                            new Date( start ),
                            new Date( end )
                        )];
                }
            }else{
                $scope.course.startDate =new Date(start);
                $scope.course.endDate =new Date(end);

            }


        }else if($location.$$path.includes('/create')){

            // $scope.course.structure = $scope.structures.first();
            // $scope.structure.sync();
            $scope.editOccurrence = false;

        }
        $scope.course.structure = $scope.structure;
        $scope.changeDate();
        Utils.safeApply($scope);
        $scope.syncSubjects();
        Utils.safeApply($scope);


        $scope.makeRecurrentCourse = () => {
            $scope.course.is_recurrent = true;
            let structure = $scope.structure;
            if (structure && structure.periodeAnnee && structure.periodeAnnee.end_date) {
                $scope.course.endDate = moment(structure.periodeAnnee.end_date).format('YYYY-MM-DDTHH:mm:ss');
            }
            Utils.safeApply($scope);
        };

        $scope.makePonctual = () => {
            $scope.course.is_recurrent = false;
            $scope.course.end = $scope.course.startDate;
            Utils.safeApply($scope);
        };

        /**
         * Drop a teacher in teachers list
         * @param {Teacher} teacher Teacher to drop
         */
        $scope.dropTeacher = (teacher: Teacher): void => {
            $scope.course.teachers = _.without($scope.course.teachers, teacher);
            $scope.syncSubjects();
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
            Utils.safeApply($scope);
        };

        /**
         * Create a course occurrence
         */
        $scope.submit_CourseOccurrence_Form = (): void => {
            $scope.course.courseOccurrences.push(_.clone($scope.courseOccurrenceForm));
            $scope.courseOccurrenceForm = new CourseOccurrence();
            $scope.changeDate();
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
         * Save course based on parameter
         * @param {Course} course course to save
         * @returns {Promise<void>} Returns a promise
         */
        $scope.saveCourse = async (course: Course): Promise<void>  => {
            $scope.changeDate();
            if (!$scope.isValidForm())
                return;
            if($scope.editOccurrence === true){
                course.syncCourseWithOccurrence($scope.courseOccurrenceForm);
                await course.update($scope.occurrenceDate);
            }
            else if(course.is_recurrent){
                let courses =  course.getCourseForEachOccurrence();
                await courses.save();
            }
            else{
                course.dayOfWeek = moment(course.startDate).day();
                course.roomLabels = $scope.courseOccurrenceForm.roomLabels;
                course.startDate = moment(moment(course.startDate).format('YYYY-MM-DD') + ' ' +  moment($scope.courseOccurrenceForm.startTime).format('HH:mm:ss'));
                course.endDate = moment(moment(course.endDate).format('YYYY-MM-DD') + ' ' + moment($scope.courseOccurrenceForm.endTime).format('HH:mm:ss'));
                await course.save();
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
                && $scope.course.subjectId.length > 0
                && moment($scope.courseOccurrenceForm.endTime).isAfter(moment($scope.courseOccurrenceForm.startTime).add(14,"minutes"))
                && ( $scope.course.subjectId !== lang.translate("exceptionnal.id")
                    || ( $scope.course.subjectId === lang.translate("exceptionnal.id")
                        && $scope.course.exceptionnal
                        && $scope.course.exceptionnal.length > 0
                        && $scope.course.exceptionnal !== " ") )
                && (
                    (
                        $scope.course.is_recurrent
                        && $scope.course.courseOccurrences
                        && $scope.course.courseOccurrences.length > 0
                        && Utils.isValidDate($scope.course.startDate, $scope.course.endDate)
                    )
                    ||
                    (
                        !$scope.course.is_recurrent
                        && isNaN($scope.courseOccurrenceForm.startTime._d)
                        && isNaN($scope.courseOccurrenceForm.endTime._d)
                    )
                );
        };


        $scope.startTimeIsAfterEdTime = () =>{
            return   moment($scope.courseOccurrenceForm.endTime).isAfter(moment($scope.courseOccurrenceForm.startTime).add(14,"minutes"));
        };

        $scope.tryDropCourse = () => {
            $scope.openedLightbox = !$scope.openedLightbox;
            $scope.openedLightbox = true;
        };

        $scope.dropCourse = async (course: Course ) => {
            if( course.canManage) {
                $scope.editOccurrence ? await course.delete($scope.occurrenceDate):  await course.delete();
                delete  $scope.course;
                $scope.goTo('/');
                $scope.syncCourses();
            }
        };

        $scope.closeLightbox = () => {
            $scope.openedLightbox = false;
        };

    }]);