import { Config } from 'core/config.gen';
import { execFile } from 'child_process';
import { Printer } from './base';
import { Regex, Print, Parser, DateTime, File } from '..';

export class Tsc_Ttp247 {
    /**
     * App
     */
    protected _app: string = File.RealPath('./workspace/custom/helpers/printer/TscPrinter/TscPrinter.exe');
    public get app(): string {
        return this._app;
    }

    /**
     * Printer Name
     */
    protected _device: string = Config.printer.device;
    public get device(): string {
        return this._device;
    }

    /**
     * Printer font family
     */
    protected _fontFamily: string = Config.printer.fontFamily;
    public get fontFamily(): string {
        return this._fontFamily;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization device
     */
    public Initialization(): void {
        this._isInitialization = false;

        this._isInitialization = true;
    }

    /**
     * Print FET sticker
     * @param visitor
     * @param respondent
     * @param location
     * @param date
     * http://localhost:6061/printer/tsc_ttp247?visitorName=AAA&respondentName=BBB&date=CCC&locationName=DDD
     */
    public async PrintFetSticker(visitor: string, respondent: string, location: string, date: string = DateTime.ToString(new Date(), 'MM/DD')): Promise<string> {
        try {
            if (!this._isInitialization) {
                throw Printer.Message.DeviceNotInitialization;
            }

            let result: string = await new Promise<string>((resolve, reject) => {
                try {
                    execFile(this._app, [this._device, this._fontFamily, visitor, respondent, date, location], (error, stdout) => {
                        if (error) {
                            return reject(error);
                        }

                        resolve(stdout);
                    });
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });

            return result;

            // let Tsclibnet: any = edge.func({
            //     source: function() {
            //         /*
            //             using System;
            //             using System.Runtime.InteropServices;
            //             using System.Threading.Tasks;

            //             public class Program
            //             {
            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void openport(string a);

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void closeport();

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void clearbuffer();

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void setup(string a, string b, string c, string d, string e, string f, string g);

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void sendcommand(string command);

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void printlabel(string a, string b);

            //                 [DllImport("TSCLIB.dll")]
            //                 public static extern void windowsfont(int a, int b, int c, int d, int e, int f, string g, string h);

            //                 public async Task<object> Invoke(dynamic input)
            //                 {
            //                     try
            //                     {
            //                         string ip = (string)input.ip;
            //                         int port = (int)input.port;
            //                         string visitor = (string)input.visitor;
            //                         string respondent = (string)input.respondent;
            //                         string date = (string)input.date;
            //                         string location = (string)input.location;

            //                         string fontFamily = "Microsoft JhenHei UI";

            //                         openport("TSC TTP-247");

            //                         setup("84", "84", "3", "10", "0", "0", "0");
            //                         clearbuffer();
            //                         sendcommand("DIRECTION 0,0");
            //                         //sendcommand("BOX 20,220,780,600,4");
            //                         windowsfont(555, 495, 120, 180, 0, 0, fontFamily, visitor);
            //                         windowsfont(550, 345, 100, 180, 0, 0, fontFamily, respondent);
            //                         windowsfont(550, 220, 120, 180, 0, 0, fontFamily, date);
            //                         windowsfont(310, 220, 120, 180, 0, 0, fontFamily, location);
            //                         printlabel("1", "1");

            //                         closeport();

            //                         return null;
            //                     }
            //                     catch (Exception ex)
            //                     {
            //                         return ex.Message;
            //                     }
            //                 }
            //             }
            //         */
            //     },
            //     references: [this._dllPath],
            // });

            // await new Promise((resolve, reject) => {
            //     Tsclibnet(
            //         {
            //             ip: this._ip,
            //             port: this._port,
            //             visitor: visitor,
            //             respondent: respondent,
            //             date: date,
            //             location: location,
            //         },
            //         function(e, result) {
            //             if (result !== null) {
            //                 reject(result);
            //             }

            //             resolve();
            //         },
            //     );
            // }).catch((e) => {
            //     throw e;
            // });
        } catch (e) {
            throw e;
        }
    }
}
