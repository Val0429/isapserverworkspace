import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';
import * as Main from '../../main';

Main.ready$.subscribe({
    next: async () => {
        if (!Config.mongodb.enable) {
            return;
        }

        createIndex('Camera', 'cameraIndex', { type: 1 });
        createIndex('LocationArea', 'locationAreaIndex', { floor: 1 });
        createIndex('LocationDevice', 'locationDeviceIndex', { floor: 1, area: 1, type: 1 });
        createIndex('ReportHumanDetectionSummary', 'reportHDSummaryIndex', { type: 1, date: 1, floor: 1, area: 1 });
        createIndex('ReportHumanDetection', 'reportHDIndex', { date: 1, floor: 1, area: 1, value: 1 });
        createIndex('UserInfo', 'userInfoIndex', { user: 1 });
    },
});
