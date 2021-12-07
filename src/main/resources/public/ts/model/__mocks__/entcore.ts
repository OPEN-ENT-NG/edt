declare let global: any;

export const moment = global.moment;
export const _ = global._;
export const ng = {
    service: jest.fn()
};

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
