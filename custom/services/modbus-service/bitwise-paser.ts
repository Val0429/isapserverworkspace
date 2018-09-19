

export namespace BitwiseParser{
    export async function Word2ByteArray(numAry: Array<number>) : Promise<Array<number>>{
        let result  : Array<number> = [];
        for(let val of numAry){
            let num1 : number = (<number>(val) & 0xFF00) >> 8;
            let num2 : number = (<number>(val) & 0x00FF) >> 0;
            result.push(num1);
            result.push(num2);
        }
        return result;
    }

    export async function Word2ByteString(numAry: Array<number>) : Promise<string>{
        let result  : string = "";
        for(let val of numAry){
            let num1 : number = (<number>(val) & 0xFF00) >> 8;
            let num2 : number = (<number>(val) & 0x00FF) >> 0;
            result += num1 + "";
            result += num2 + "";
        }
        return result;
    }

    export async function Word2HexString(numAry: Array<number>) : Promise<string>{

        let result  : string = "";

        for(let val of numAry){
            let num1 : number = (<number>(val) & 0xF000) >> 12;
            let num2 : number = (<number>(val) & 0x0F00) >> 8;
            let num3 : number = (<number>(val) & 0x00F0) >> 4;
            let num4 : number = (<number>(val) & 0x000F) >> 0;
            
            result += (num1>10?String.fromCharCode(num1+55):num1);
            result += (num2>10?String.fromCharCode(num2+55):num2);
            result += (num3>10?String.fromCharCode(num3+55):num3);
            result += (num4>10?String.fromCharCode(num4+55):num4);
        }

        return result;
    }

    export async function Word2Int32(numAry: Array<number>) : Promise<Array<number>>{
        let result   : Array<number> = [];
        let counter  : number = 0;
        let temp : number = 0;
        for(let val of numAry){
            if(!!(counter++ & 0x0001) === false) temp |= val;
            else{
                temp<<=16;
                temp |= val;
                result.push(temp);
                temp = 0;
            }
        }
        return result;
    }
}