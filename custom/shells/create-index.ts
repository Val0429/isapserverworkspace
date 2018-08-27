import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { createIndex, sharedMongoDB } from 'helpers/parse-server/parse-helper';

import './create-index/index';
