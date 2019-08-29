import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';
import * as Main from '../../main';

Main.ready$.subscribe({
    next: async () => {
        if (!Config.mongodb.enable) {
            return;
        }

        createIndex('DeviceGroup', 'index', { mode: 1, site: 1, area: 1 });
        createIndex('Device', 'index', { mode: 1, site: 1, area: 1 });
        createIndex('LocationArea', 'index', { site: 1 });
        createIndex('OfficeHour', 'index', { sites: 1 });
        createIndex('ReportSalesRecord', 'index', { date: 1, site: 1 });
        createIndex('Tag', 'index', { sites: 1 });
        createIndex('UserGroup', 'index', { sites: 1 });
        createIndex('UserInfo', 'index', { user: 1 });
        createIndex('Weather', 'index', { site: 1 });

        createIndex('ReportDemographicSummary', 'index', { type: 1, site: 1, date: 1 });
        createIndex('ReportDemographic', 'index', { date: 1, device: 1 });
        createIndex('ReportDwellTimeSummary', 'index', { type: 1, site: 1, date: 1 });
        createIndex('ReportDwellTime', 'index', { date: 1, site: 1, area: 1 });
        createIndex('ReportHeatmapSummary', 'index', { type: 1, site: 1, date: 1 });
        createIndex('ReportHumanDetectionSummary', 'index', { type: 1, site: 1, date: 1 });
        createIndex('ReportHumanDetection', 'index', { date: 1, site: 1, area: 1 });
        createIndex('ReportIdentityPerson', 'index', { site: 1, date: 1 });
        createIndex('ReportPeopleCountingSummary', 'index', { type: 1, site: 1, date: 1 });
        createIndex('ReportPeopleCounting', 'index', { date: 1, device: 1 });
        createIndex('ReportRepeatVisitor', 'index', { site: 1, date: 1 });
    },
});
