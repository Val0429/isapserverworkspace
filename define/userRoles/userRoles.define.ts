var userRoles: Config[] = [
    [
        0,
        'SystemAdmin',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
    [
        10,
        'Admin',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
    [
        20,
        'Manager',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
    [
        30,
        'User',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
    [
        40,
        'Investigator',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
    [
        50,
        'Edge',
        `
            realname: string;
            permission?: number;
            imei?: string;
            regions?: IRegion[];
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        ['IRegion'],
    ],
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];
