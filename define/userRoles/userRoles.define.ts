var userRoles: Config[] = [
    [0, "SystemAdministrator"],

    [10, "Administrator"],

    [20, "User"]
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];