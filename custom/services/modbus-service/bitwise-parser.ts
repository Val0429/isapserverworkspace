

export namespace BitwiseParser{

    /**
     * Convert word to byte array in bit
     * 
     * e.g. 
     *                DEC           BRY
     *  (word)       51771    => 11001010 00111011 
     *  (byte)       202      <= 11001010  
     *  (byte)       59       <=          00111011 
     * 
     * return [202,59]
     * 
     * @param numAry word data array
     * 
     * return 
     */
    export function Word2ByteArray(numAry: Array<number>) : Array<number>{
        let result  : Array<number> = [];
        for(let val of numAry){
            let num1 : number = (<number>(val) & 0xFF00) >> 8;
            let num2 : number = (<number>(val) & 0x00FF) >> 0;
            result.push(num1);
            result.push(num2);
        }
        return result;
    }

    /**
     * Convert word to byte string in bit
     * 
     * * e.g. 
     *                DEC           BRY
     *  (word)       51771    => 11001010 00111011 
     *  (byte)       202      <= 11001010  
     *  (byte)       59       <=          00111011 
     * 
     * return "20259"
     * 
     * @param numAry word data array
     */
    export function Word2ByteString(numAry: Array<number>) : string{
        let result  : string = "";
        for(let val of numAry){
            let num1 : number = (<number>(val) & 0xFF00) >> 8;
            let num2 : number = (<number>(val) & 0x00FF) >> 0;
            result += num1 + "";
            result += num2 + "";
        }
        return result;
    }

    /**
     * Convert word to hex string in bit
     * 
     * * e.g. 
     *                DEC           BRY
     *  (word)       51771    => 11001010 00111011 
     *  (byte)       12(C)    <= 1100  
     *  (byte)       10(A)    <=     1010
     *  (byte)       3 (3)    <=          0011 
     *  (byte)       11(B)    <=              1011 
     *  
     * return "CA3B"
     * 
     * @param numAry word data array
     */
    export function Word2HexString(numAry: Array<number>) : string{

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

    /**
     * Convert word to int 32 bit format
     * 
     * * e.g. 
     *                DEC           BRY
     *  (word1)      51771    => 11001010 00111011 
     *  (word2)      41287    => 10100001 01000111
     *  (int32)   3392905543  => 11001010 00111011 10100001 01000111
     * 
     * return 3392905543
     * 
     * @param numAry word data array
     */
    export function Word2Int32(numAry: Array<number>) : Array<number>{
        let result   : Array<number> = [];
        let counter  : number = 0;
        let temp : number = 0;
        for(let val of numAry){
            if(!!(counter++ & 0x0001) === false) temp |= val;
            else{
                result.push((temp<<16) | val);
                temp = 0;
            }
        }
        return result;
    }
}