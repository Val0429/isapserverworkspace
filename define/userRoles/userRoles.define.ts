var userRoles: Config[] = [
    [0, "Administrator"],

    // [1, "ManagementCommitee"],

    // [2, "Resident"],

    [99, "SystemAdministrator"]
];

export default userRoles;

export type Config = [number, string, string] | [number, string];