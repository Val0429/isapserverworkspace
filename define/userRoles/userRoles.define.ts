var userRoles: Config[] = [
    [0, "SystemAdministrator"],

    [10, "Administrator"],

    [20, "TenantAdministrator", `
        /**
         * Which company this Tenant Administrator is in.
         */
        company: Companies;
        /**
         * Which floors this Tenant Administrator is allowed to create user.
         */
        floor: Floors[];
    `, ["Companies", "Floors"]],

    [21, "TenantUser", `
        /**
         * Description to hint walk-in visitor.
         */
        description: string;
        /**
         * Which company this Tenant Administrator is in.
         */
        company: Companies;
        /**
         * Which floor this Tenant User is allowed to invite.
         */
        floor: Floors[];
    `, ["Companies", "Floors"]],

    [80, "Kiosk", `
        /**
         * Name of this kiosk.
         */
        kioskId: string;
        kioskName: string;
        activated?: boolean;
    `]
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];