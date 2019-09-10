export const  ADDRESS_MAX_LEN = 129;
export const  USERNAME_MAX_LEN = 64;
export const  PASSWD_MAX_LEN = 64;

export const  CARD_NO_LEN = 32; //access card No. len
export const  CARD_NAME_LEN = 32;  //access card No. len


export enum E_EventType {
    ENUM_LEGAL_CARD_PASS = 1,   //	Legal card authentication passed        
	ENUM_CARD_OUT_OF_DATE = 2,  //	Expired card number 
	ENUM_INVALID_CARD = 3,      //	Invalid card no   
	ENUM_FACE_VERIFY_PASS = 4,  //  Face verification passed    
	ENUM_FACE_VERIFY_FAIL = 5,  //  Face verification failed   
}


export interface I_DeviceInfo {
    ipAddress: string,  // 172.16.10.216
    port: string, //8000
    account: string, // admin
    password:string // suntec123
}

export interface I_ValidPeriodTime {
	year:string, // 2019
	month:string, // 08
	day:string, //08
	hour:string, // 23
	minute:string, // 59
	second:string //59
}

export interface I_CardParamCfg {
	cardNo:string, //card No
	employeeNo:string, //employee no(user id)
	name:string, //name
	beginTime:I_ValidPeriodTime,
	endTime:I_ValidPeriodTime
}


export interface I_FaceParamCfg {
	cardNo?:string, //card No
	faceLen?:number, //face length <DES>
	faceBuffer?:Buffer
}

export interface I_EventTime {
	year?:string,
	month?:string,
	day?:string,
	hour?:string,
	minute?:string,
	second?:string
}

export interface I_AlarmInfo {
	time?:I_EventTime,
	eventType?:E_EventType,
	deviceAddress?:string,
	cardNo?:string, //card No
	timeType?:string, //time type:0-local time,1-UTC time(struTime struct)
	picDataLen?:number,//picture length, when 0 ,means has no picture
	picData?:Buffer
}

export interface I_SdkResponse {
	result : boolean,
	errorMessage : string
}

