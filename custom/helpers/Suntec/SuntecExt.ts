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
    MobileNo?: String;
    CompanyName : String;
    OfficeBuilding: String; 
}

export interface IRevoke
{
    AccessId: String;
}

