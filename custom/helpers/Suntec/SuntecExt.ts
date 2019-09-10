export interface ISuntecExt
{
    protocal : 'https';
    host : string;
    token : string;
}

export interface ISignup
{
    AccessId: String;
    Email: String;
    FirstName: String;
    LastName: String;
    MobileNo: String;
    Country: String;
}

export interface IRevoke
{
    AccessId: String;
}

