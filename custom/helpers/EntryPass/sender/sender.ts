import * as net from 'net';

function ComposeErrorMessage(errorType: string): string{
    return "error: Connection " + errorType
}

export async function SendSingleReqeust(address: string, port: number, request: string): Promise<string> {
    return await new Promise((resolve) => {
        let client = new net.Socket()
        client.once("data", (data: string) => {
            //console.log("reiceved data=" + data);
            resolve(data);
            client.end();
        }).once("connect", () => {
            //console.log("connected");
            client.write(request, () => {
                //console.log("write completed")
            })
        }).once("end", () => {
            resolve(ComposeErrorMessage("end"))
            client.end();
        }).once("close", () => {
            resolve(ComposeErrorMessage("close"))
            client.end();
        }).once("timeout", () => {
            resolve(ComposeErrorMessage("timeout"))
            client.destroy();
        }).once("error", () => {
            resolve(ComposeErrorMessage("error"))
            client.destroy();
        });

        //console.log("Connect to remote: " + address + ":" + port);
        client.setTimeout(3000);
        client.connect(port, address);
    })
}