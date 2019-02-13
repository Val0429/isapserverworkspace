var userRoles: Config[] = [
    [
        0,
        'SystemAdmin',
        `
            realname: string;
            permission?: number;
            imei?: string;
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        [],
    ],
    [
        10,
        'Admin',
        `
            realname: string;
            permission?: number;
            imei?: string;
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        [],
    ],
    [
        20,
        'Manager',
        `
            realname: string;
            permission?: number;
            imei?: string;
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        [],
    ],
    [
        30,
        'User',
        `
            realname: string;
            permission?: number;
            imei?: string;
            creator?: Parse.User;
            isDisable?: boolean;
        `,
        [],
    ],
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];
