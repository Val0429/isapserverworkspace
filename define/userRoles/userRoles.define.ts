import { Config } from "core/config.gen";

let flow = Config.vms.flow;

var userRoles: Config[];

if (flow === 'Flow1') {
    userRoles = [
        [0, "SystemAdministrator"],
    
        [10, "Administrator"],
    
        [20, "TenantAdministrator", `
            /**
             * Which company this Tenant Administrator is in.
             */
            company: ${flow}Companies;
            /**
             * Which floors this Tenant Administrator is allowed to create user.
             */
            floor: ${flow}Floors[];
        `, [`${flow}Companies`, `${flow}Floors`]],
    
        [21, "TenantUser", `
            /**
             * Description to hint walk-in visitor.
             */
            description: string;
            /**
             * Which company this Tenant Administrator is in.
             */
            company: ${flow}Companies;
            /**
             * Which floor this Tenant User is allowed to invite.
             */
            floor: ${flow}Floors[];
        `, [`${flow}Companies`, `${flow}Floors`]],
    
        [80, "Kiosk", `
            /**
             * Name of this kiosk.
             */
            kioskId: string;
            kioskName: string;
            activated?: boolean;
            strictMode?: boolean;
        `]
    ];
}

if (flow === 'Flow2') {
    userRoles = [
        [0, "SystemAdministrator"],
    
        [10, "Administrator"],
    
        [20, "TenantAdministrator", `
            /**
             * Which company this Tenant Administrator is in.
             */
            company: ${flow}Companies;
            /**
             * Which floors this Tenant Administrator is allowed to create user.
             */
            floor: ${flow}Floors[];
        `, [`${flow}Companies`, `${flow}Floors`]],
    
        [21, "TenantUser", `
            /**
             * Description to hint walk-in visitor.
             */
            description: string;
            /**
             * Which company this Tenant Administrator is in.
             */
            company: ${flow}Companies;
            /**
             * Which floor this Tenant User is allowed to invite.
             */
            floor: ${flow}Floors[];
        `, [`${flow}Companies`, `${flow}Floors`]],
    
        [80, "Kiosk", `
            /**
             * Name of this kiosk.
             */
            kioskId: string;
            kioskName: string;
            building: ${flow}Buildings;
            activated?: boolean;
        `, [`${flow}Buildings`]]
    ];
}


export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];