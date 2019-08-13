import * as Xlsx from 'xlsx';

export namespace Excel {
    /**
     * Read excel
     * @param filename
     */
    export function Read(filename: string): Xlsx.WorkBook {
        try {
            let workbook: Xlsx.WorkBook = Xlsx.readFile(filename);
            return workbook;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Write excel
     * @param filename
     * @param data
     */
    export function Write(filename: string, data: Xlsx.WorkBook): void {
        try {
            Xlsx.writeFile(data, filename);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Generate WorkBook
     * @param sheets
     */
    export function GenerateWorkBook(sheets: { name: string; data: object[] }[]): Xlsx.WorkBook {
        try {
            let workbook: Xlsx.WorkBook = {
                SheetNames: [],
                Sheets: {},
            };

            sheets.forEach((value, index, array) => {
                workbook.SheetNames.push(value.name);
                workbook.Sheets[value.name] = Xlsx.utils.json_to_sheet(value.data);
            });

            return workbook;
        } catch (e) {
            throw e;
        }
    }
}
