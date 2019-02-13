let edge = require('edge-js');
import { Printer } from './base';
import { Regex, Print, Parser, DateTime } from '..';

export class Tsc_Ttp247 {
    /**
     * Device Ip
     */
    protected _ip: string;
    public get ip(): string {
        return this._ip;
    }
    public set ip(value: string) {
        this._ip = value;
    }

    /**
     * Device Port
     */
    protected _port: number = 9100;
    public get port(): number {
        return this._port;
    }
    public set port(value: number) {
        this._port = value;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Dll path
     */
    protected _dllPath: string;
    public get dllPath(): string {
        return this._dllPath;
    }
    public set dllPath(value: string) {
        this._dllPath = value;
    }

    /**
     * Initialization device
     */
    public Initialization(): void {
        this._isInitialization = false;

        if (this._ip === null || this._ip === undefined || !Regex.IsIp(this._ip)) {
            throw Printer.Message.SettingIpError;
        }

        if (this._port === null || this._port === undefined || !Regex.IsNum(this._port.toString()) || this._port < 1 || this._port > 65535) {
            throw Printer.Message.SettingPortError;
        }

        this._isInitialization = true;
    }

    /**
     * Print FET sticker
     * @param visitor
     * @param respondent
     * @param location
     * @param date
     */
    public async PrintFetSticker(visitor: string, respondent: string, location: string, date: string = DateTime.DateTime2String(new Date(), 'MM/DD')) {
        try {
            if (!this._isInitialization) {
                throw Printer.Message.DeviceNotInitialization;
            }

            let Tsclibnet: any = edge.func({
                source: function() {
                    /*
                        using System;
                        using System.Threading.Tasks;
                        using TSCSDK;

                        public class Startup
                        {
                            public async Task<object> Invoke(dynamic input)
                            {
                                try
                                {
                                    string ip = (string)input.ip;
                                    int port = (int)input.port;
                                    string visitor = (string)input.visitor;
                                    string respondent = (string)input.respondent;
                                    string date = (string)input.date;
                                    string location = (string)input.location;

                                    string fontFamily = "Microsoft JhenHei UI";

                                    ethernet tsc = new ethernet();
                                    tsc.openport(ip, port);

                                    tsc.setup("100", "80", "3", "10", "0", "0", "0");
                                    tsc.clearbuffer();
                                    tsc.sendcommand("DIRECTION 0,0");
                                    tsc.sendcommand("BOX 20,220,780,600,4");
                                    tsc.windowsfont(80, 250, 130, 0, 0, 0, fontFamily, visitor);
                                    tsc.windowsfont(85, 400, 90, 0, 0, 0, fontFamily, respondent);
                                    tsc.windowsfont(85, 510, 110, 0, 0, 0, fontFamily, date);
                                    tsc.windowsfont(375, 510, 110, 0, 0, 0, fontFamily, location);
                                    tsc.printlabel("1", "1");

                                    tsc.closeport();

                                    return null;
                                }
                                catch (Exception ex) 
                                {
                                    return ex.Message;
                                }
                            }
                        }
                    */
                },
                references: [this._dllPath],
            });

            await new Promise((resolve, reject) => {
                Tsclibnet(
                    {
                        ip: this._ip,
                        port: this._port,
                        visitor: visitor,
                        respondent: respondent,
                        date: date,
                        location: location,
                    },
                    function(e, result) {
                        if (result !== null) {
                            reject(result);
                        }

                        resolve();
                    },
                );
            }).catch((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }
}
