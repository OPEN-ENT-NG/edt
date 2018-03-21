import { edtBehaviours } from '../../edtBehaviours';

declare let global: any;

export const moment = global.moment;
export const _ = global._;

export const model = {
    calendar: {
        dayForWeek: global.dayOfWeek,
    },
    me: {
        userId: global.teacherId,
        type: global.user_type,
        hasWorkflow: jest.fn(() => true),
        hasRight: jest.fn(() => true)
    },
};

export const Behaviours = {
    applicationsBehaviours : {
        edt : edtBehaviours
    }
};