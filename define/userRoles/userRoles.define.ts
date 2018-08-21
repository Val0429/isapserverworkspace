var userRoles: Config[] = [
    [0, "Administrator"],

    [1, "TenantAdministrator", `
        /**
         * Which company this Tenant Administrator is in.
         */
        company: Companies;
        /**
         * Which floors this Tenant Administrator is allowed to create user.
         */
        floor: Floors[];
    `, ["Companies"]],

    [2, "TenantUser", `
        /**
         * Who created this Tenant User.
         */
        parent: Parse.User;
        /**
         * Which floor this Tenant User is allowed to invite.
         */
        floor: Floors[];
    `, ["Floors"]],

    [80, "Kiosk", `
        /**
         * Name of this kiosk.
         */
        kioskId: string;
        kioskName: string;
    `],

    [99, "SystemAdministrator"]
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];