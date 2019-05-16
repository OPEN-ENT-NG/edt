import { moment, model, Behaviours, _ } from 'entcore';


export class UtilDragAndDrop {

    static moveScheduleItem = (e,dragging) => {
        if(dragging){
            let positionScheduleItem = {
                top: e.pageY - dragging.height()/2,
                left: e.pageX - dragging.width()/2
            };
            dragging.offset(positionScheduleItem);
        }
    };

    static drag = (e,dragging,  ) => {
        let topPositionnement=0;
        if(dragging){
            $('calendar .selected-timeslot').remove();
            let curr = $(e.currentTarget);
            let currDivHr = curr.children('hr');
            let notFound = true;
            let i:number = 0;
            let prev = curr;
            let next  ;
            while ( notFound && i < currDivHr.length  ){
                next = $(currDivHr)[i];
                if(!($(prev).offset().top <= e.pageY && e.pageY > $(next).offset().top  ))
                    notFound = false;
                prev = next;
                i++
            }
            let top = Math.floor(dragging.height()/2);
            for(let z= 0; z <= 5 ; z++){
                if ( ((top + z) % 10) === 0 )
                {
                    top = top + z;
                    break;
                }
                else if(((top - z) % 10) === 0){
                    top = top - z;
                    break;
                }
            }
            topPositionnement = UtilDragAndDrop.getTopPositioning(dragging);
            if($(prev).prop("tagName") === 'HR' &&  notFound === false ) {
                $(prev).before(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }else if( i >= currDivHr.length && notFound === true ){
                $(next).after(`<div class="selected-timeslot" style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }else{
                $(prev).append(`<div class="selected-timeslot"  style="height: ${dragging.height()}px; top:-20px;"></div>`);
            }
        }
        return topPositionnement;
    };

    static getTopPositioning = (dragging) => {
        let top = Math.floor(dragging.height()/2);
        for(let z= 0; z <= 5 ; z++){
            if ( ((top + z) % 10) === 0 )
            {
                top = top + z;
                break;
            }
            else if(((top - z) % 10) === 0){
                top = top - z;
                break;
            }
        }
        return top;
    };

    static takeSchedule = (e, timeslots) => {
        timeslots.addClass( 'selecting-timeslot' );
        $(document).mousedown((e) => {return false;});
        return $(e.currentTarget);
    };



    static  getCalendarAttributes=( selectedTimeslot, selectedSchedule, topPositionnement,dayOfWeek? )=>{
        if(selectedTimeslot && selectedTimeslot.length > 0 && selectedSchedule && selectedSchedule.length > 0) {
            let indexHr = $(selectedTimeslot).prev('hr').index();
            let dayOfweek = dayOfWeek ? dayOfWeek : $(selectedTimeslot).parents('div.day').index();
            let timeslot = model.calendar.timeSlots.all[$(selectedTimeslot).parents('.timeslot').index()];
            let startCourse = moment($(selectedTimeslot).parents('.timeslot').index());
                startCourse = startCourse.year(moment(model.calendar.firstDay).format("YYYY"))
                    .date(moment(model.calendar.firstDay).date()).month(moment(model.calendar.firstDay).month()).hour(timeslot.beginning).minute(indexHr * 15 -15 ).second(0)
                    .day(dayOfweek);
                ;
            let endCourse = moment(model.calendar.firstDay);
            endCourse = moment(startCourse);
             endCourse = endCourse.add(selectedSchedule.height()*3/2,"minutes");

            return {
                itemId :$($(selectedSchedule).find('.schedule-item-content')).data('id'),
                start:startCourse,
                end:endCourse
            };
        }
    };
    static drop = (e, dragging, topPositionnement, startPosition, dayOfWeek?) => {
        let actualPosition = dragging.offset();
        if(actualPosition && startPosition.top === actualPosition.top && startPosition.left === actualPosition.left)
            return undefined;
        let selected_timeslot = $('calendar .selected-timeslot');
        let positionShadowSchedule = selected_timeslot.offset();
        let courseEdit = UtilDragAndDrop.getCalendarAttributes(selected_timeslot, dragging, topPositionnement,dayOfWeek);
        dragging.offset(positionShadowSchedule);
        selected_timeslot.remove();
        $(document).unbind("mousedown");
        return courseEdit;
    }
}
