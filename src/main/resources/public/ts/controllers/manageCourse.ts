import { ng, _, model, moment, notify } from 'entcore';
import {DAYS_OF_WEEK, COMBO_LABELS, Teacher, Group, CourseOccurrence, Utils, Course, Subjects} from '../model';
import { Mix } from 'entcore-toolkit';

export let manageCourseCtrl = ng.controller('manageCourseCtrl',
    ['$scope', '$location','$routeParams',  ($scope, $location, $routeParams) => {

        $scope.daysOfWeek = DAYS_OF_WEEK;
        $scope.comboLabels = COMBO_LABELS;

        $scope.selectionOfTeacherSubject = new Subjects();
        $scope.info = {
            firstOccurrenceDate : "",
            firstWeekNumber : "",
            occurrenceInExclusion : false,
            occurrenceOutExclusion : true,
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
            let startDate = moment($scope.course.startDate).format("YYYY/MM/DD"),
                startTime = moment($scope.courseOccurrenceForm.startTime).utc().format("HH:mm:ss"),
                endDate = moment($scope.course.endDate).format("YYYY/MM/DD"),
                endTime = moment($scope.courseOccurrenceForm.endTime).utc().format("HH:mm:ss");
            if (!$scope.course.is_recurrent || moment(endDate).diff(moment(startDate), 'days') < 7) {
                endDate = startDate;
            }
            if(!Utils.isValidDate(startDate, endDate)) {
                $scope.validDate = false;
            }
            else{
                $scope.validDate = true;
                $scope.courseOccurrenceForm.startTime =  $scope.course.startDate = moment(startDate + 'T' + startTime).utc().toDate();
                $scope.courseOccurrenceForm.endTime = $scope.course.endData = moment(endDate + 'T' + endTime).utc().toDate();

                $scope.course.courseOccurrences = _.map($scope.course.courseOccurrences, (item)=> {
                    let startTime = moment(item.startTime).utc().format("HH:mm:ss"),
                        endTime = moment(item.endTime).utc().format("HH:mm:ss");
                    item.startTime = moment(startDate + 'T' + startTime).utc().toDate();
                    item.endTime = moment(endDate + 'T' + endTime).utc().toDate();
                    return item;
                });
            }
            $scope.UpToDateInfo();
            $scope.info.occurrenceInExclusion = $scope.isCourseInExclusions();
            $scope.info.occurrenceOutExclusion = $scope.isCourseOutExclusions();
            Utils.safeApply($scope);
        };

        $scope.isCourseInExclusions = ():boolean => {
           let isOccurrenceInExclusion = false;
           let exclusion;
           let isCourseInExclusion = () => {
               let startOccurrence ;
               let startExclusion = moment(exclusion.start_date), endExclusion =moment(exclusion.end_date) ;
               if( !$scope.course.is_recurrent ){
                   startOccurrence = moment($scope.course.startDate);
                   return !(startOccurrence.isBefore(startExclusion) || startOccurrence.isAfter(endExclusion))
               } else {
                   let courses = $scope.course.getCourseForEachOccurrence();
                   for(let i= 0; i< courses.all.length; i++){
                     let occurrenceDate = Mix.castAs(Course,courses.all[i]).getNextOccurrenceDate(exclusion.start_date);
                     if(!(moment(occurrenceDate).isBefore(startExclusion) || moment(occurrenceDate).isAfter(endExclusion)))
                         return true;
                   }
                   return false;
               }
           };
           for(let i = 0; i < $scope.structure.exclusions.all.length; i++){
               exclusion = $scope.structure.exclusions.all[i];
               if(isCourseInExclusion()){
                   isOccurrenceInExclusion = true;
                   break;
               }
           }
            return isOccurrenceInExclusion;
        };

        $scope.isCourseOutExclusions = ():boolean => {
            let occurrenceOutExclusion = true;
            let exclusion;
            let isCourseOutExclusion = () => {
                let startExclusion = moment(exclusion.start_date), endExclusion =moment(exclusion.end_date) ;
                if(!$scope.course.is_recurrent){
                    let startOccurrence = moment($scope.course.startDate);
                    return (startOccurrence.isBefore(startExclusion) || startOccurrence.isAfter(endExclusion))
                } else {
                    let courses = $scope.course.getCourseForEachOccurrence();
                    for(let i= 0; i< courses.all.length; i++){
                        let startDate = moment(courses.all[i].startDate);
                        let occurrenceDateFirst = Mix.castAs(Course,courses.all[i]).getNextOccurrenceDate(startDate);
                        let occurrenceDateLast = Mix.castAs(Course,courses.all[i]).getLastOccurrence();
                        if( moment(occurrenceDateFirst).isAfter(startExclusion)
                                && (moment(occurrenceDateLast).isBefore(endExclusion) ))
                            return false;
                    }
                    return true;
                }
            };
            for(let i = 0; i < $scope.structure.exclusions.all.length; i++){
                exclusion = $scope.structure.exclusions.all[i];
                if(!isCourseOutExclusion()){
                    occurrenceOutExclusion = false;
                    break;
                }
            }
            return occurrenceOutExclusion;
        };

        $scope.syncSubjects = async () => {
            ($scope.selectionOfTeacherSubject) ? $scope.selectionOfTeacherSubject : $scope.selectionOfTeacherSubject = new Subjects();
            if ($scope.course.teachers.length > 0) {
                await $scope.selectionOfTeacherSubject.sync($scope.structure.id, _.pluck($scope.course.teachers, 'id'));

              if($scope.selectionOfTeacherSubject.all.length && $scope.selectionOfTeacherSubject.all.length > 0)
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
                $scope.course.dayOfWeek = moment(start).day();
                if (!$scope.course.is_recurrent) {
                    $scope.course.startDate =  $scope.course.end = start;
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
            $scope.editOccurrence = false;
        }
        $scope.changeDate();
        Utils.safeApply($scope);

        $scope.makeRecurrentCourse = () => {
            let structure = $scope.structure;
            if (structure && structure.periodeAnnee && structure.periodeAnnee.end_date) {
                $scope.course.endDate = moment(structure.periodeAnnee.end_date).format('YYYY-MM-DDTHH:mm:ss');
            }
        };

        $scope.makePonctual = () => {
            $scope.course.end = $scope.course.startDate;
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

        $scope.validDate = Utils.isValidDate($scope.course.startDate, $scope.course.endDate);

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
                && $scope.isCourseOutExclusions()
                && moment($scope.courseOccurrenceForm.endTime).isAfter(moment($scope.courseOccurrenceForm.startTime).add(14,"minutes"))
                && (
                    (
                        $scope.course.is_recurrent
                        && $scope.course.courseOccurrences
                        && $scope.course.courseOccurrences.length > 0
                        && $scope.validDate
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
        }
        $scope.dropCourse = async (course: Course ) => {

            if( course.canManage && confirm("Souhaitez vous supprimer ce cours?")) {

                $scope.editOccurrence ? await course.delete($scope.occurrenceDate):  await course.delete();
                delete  $scope.course;
                $scope.goTo('/');
                $scope.syncCourses();
            }
        };
    }]);