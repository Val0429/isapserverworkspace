import * as net from 'net';

export async function SendSingleReqeust(address: string, port: number, request: string) {

    let result = await new Promise(resolve => {
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
        }).on("end", () => {
            //console.log("received end event");
            client.end();
        }).on("close", () => {
            //console.log("received close event");
            client.end();
        }).on("timeout", () => {
            //console.log("received timeout event");
            client.destroy();
        }).on("error", () => {
            //console.log("received error event");
            client.destroy();
        });

        //console.log("Connect to remote: " + address + ":" + port);
        client.setTimeout(3000);
        client.connect(port, address);
    })
    return result;
}