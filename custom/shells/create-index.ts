import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';


import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';

import {
    Reader, Door, Floor, FloorGroup, Elevator, DoorGroup, ElevatorGroup, Member, TimeSchedule, AccessLevel,
    PermissionTable, WorkGroup, SyncNotification, AttendanceRecords, DropDownList
} from '../../custom/models'

(async () => {

    /// indexes ////////////////
    /// Kiosk
    createIndex("_User", "kioskUniqueID",
        { "data.kioskId": 1 },
        { unique: true, partialFilterExpression: { "data.kioskId": { $exists: true } } }
    );
    /// Floors
    createIndex("Floors", "floorsUniqueFloor",
        { "floor": 1 },
        { unique: true }
    );
    /// Faces
    createIndex("FRSFaces", "facesIndexMain",
        { "groups.name": 1, "channel": 1, "timestamp": 1 }
    );
    createIndex("FRSFaces", "facesIndexName",
        { "person_info.fullname": "text" }
    );
    ////////////////////////////

    /// default ////////////////
    /// Create default API Tokens
    let token = await new Parse.Query(APITokens).first();
    if (!token) {
        token = new APITokens(); await token.save({ identifier: "1-1_user_Permission_CRUD" });
        token = new APITokens(); await token.save({ identifier: "1-2_user_Management_CRUD" });

        token = new APITokens(); await token.save({ identifier: "2-1_report_member_R" });
        token = new APITokens(); await token.save({ identifier: "2-2_report_door_R" });
        token = new APITokens(); await token.save({ identifier: "2-3_report_doorgroup_R" });
        token = new APITokens(); await token.save({ identifier: "2-4_report_card_R" });
        token = new APITokens(); await token.save({ identifier: "2-5_report_contractor_R" });
        token = new APITokens(); await token.save({ identifier: "2-6_report_demographic_R" });
        token = new APITokens(); await token.save({ identifier: "2-7_report_attendance_R" });
        token = new APITokens(); await token.save({ identifier: "2-8_report_visitor_R" });

        token = new APITokens(); await token.save({ identifier: "3-1_door_accesslevel_CRUD" });
        token = new APITokens(); await token.save({ identifier: "3-2_door_member_CRUD" });
        token = new APITokens(); await token.save({ identifier: "3-3_door_permissiontable_CRUD" });

        token = new APITokens(); await token.save({ identifier: "4-1_location_area_CRUD" });
        token = new APITokens(); await token.save({ identifier: "4-2_location_site_CRUD" });
        token = new APITokens(); await token.save({ identifier: "4-3_location_region_CRUD" });

        token = new APITokens(); await token.save({ identifier: "5-1_door_door_CRUD" });
        token = new APITokens(); await token.save({ identifier: "5-2_door_doorgroup_CRUD" });
        token = new APITokens(); await token.save({ identifier: "5-3_door_floor_CRUD" });
        token = new APITokens(); await token.save({ identifier: "5-4_door_elevator_CRUD" });
        token = new APITokens(); await token.save({ identifier: "5-5_door_reader_CRUD" });
        token = new APITokens(); await token.save({ identifier: "5-6_door_elevatorgroup_CRUD" });

        token = new APITokens(); await token.save({ identifier: "6-1_notification_sync_CRUD" });

        token = new APITokens(); await token.save({ identifier: "7-1_system_hurmanresource_CRUD" });
        token = new APITokens(); await token.save({ identifier: "7-2_system_license_CRUD" });
        token = new APITokens(); await token.save({ identifier: "7-3_system_operationlog_R" });
    }

    let apiRole = await new Parse.Query(APIRoles).first();
    if (!apiRole) {
        apiRole = new APIRoles(); await apiRole.save({ identifier: "Full Access Group" });
    }

    let permission = await new Parse.Query(APIPermissions).first();
    if (!permission) {
        let tokens = await new Parse.Query(APITokens).find();
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            await APIPermissions.set(t, apiRole, { C: true, R: true, U: true, D: true });
        }
    }
    ////////////////////////////


    /// Create default roles
    let role = await new Parse.Query(Parse.Role)
        .first();
    if (!role) {
        for (var key in RoleList) {
            var name = RoleList[key];
            var roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            role = new Parse.Role(name, roleACL);
            await role.save();
        }
        console.log("Default Role created.");
    }

    /// Create default users
    let user = await new Parse.Query(Parse.User)
        .first();
    if (!user) {
        user = new Parse.User();
        await user.save({
            username: "Admin",
            password: "123456",
        });
        /// Add <Administrator> and <SystemAdministrator> as default
        var roles = [];
        for (name of [RoleList.Admin, RoleList.SystemAdministrator]) {
            role = await new Parse.Query(Parse.Role)
                .equalTo("name", name)
                .first();
            role.getUsers().add(user);
            await role.save(null, { useMasterKey: true });
            roles.push(role);
        }
        user.set("roles", roles);
        user.set("apiRoles", [apiRole]);
        await user.save(null, { useMasterKey: true });
        console.log("Default User created.");
    }
    ////////////////////////////


    /// Create default API Tokens
    let dropItem = await new Parse.Query(DropDownList).first();
    if (!dropItem) {
        dropItem = new DropDownList(); await dropItem.save({ type: "ProfileId", key: 1, name: "26 bit" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ProfileId", key: 3, name: "35 bit" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ProfileId", key: 4, name: "mifare32" });

        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 1, name: "正職" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 2, name: "ASR臨時卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 3, name: "DOC臨時卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 4, name: "GSA臨時卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 5, name: "IDC臨時卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 6, name: "NOC臨時卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 7, name: "下包商" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 8, name: "子公司" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 9, name: "契約商_長駐" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 10, name: "契約商_短派" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 11, name: "施工" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 12, name: "約聘" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 13, name: "租戶" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 14, name: "停車卡" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 15, name: "訪客" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 16, name: "貴賓" });
        dropItem = new DropDownList(); await dropItem.save({ type: "Certification", key: 17, name: "電梯卡" });

        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 1, name: "一般員工" });
        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 2, name: "工程專用" });
        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 3, name: "公務專用" });
        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 4, name: "主管專用" });
        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 5, name: "殘障專用" });
        dropItem = new DropDownList(); await dropItem.save({ type: "License", key: 6, name: "業務" });

        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason1", key: 1, name: "新申請" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason1", key: 2, name: "補發-更名" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason1", key: 3, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason1", key: 4, name: "補發-遺失" });

        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason2", key: 1, name: "補發-更名" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason2", key: 2, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason2", key: 3, name: "補發-遺失" });

        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason3", key: 1, name: "補發-更名" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason3", key: 2, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "CreateReason3", key: 3, name: "補發-遺失" });

        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason1", key: 1, name: "新申請" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason1", key: 2, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason1", key: 3, name: "補發-遺失" });

        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason2", key: 1, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason2", key: 2, name: "補發-遺失" });

        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason3", key: 1, name: "補發-損壞" });
        dropItem = new DropDownList(); await dropItem.save({ type: "ApplyReason3", key: 2, name: "補發-遺失" });
    }

    ////////////////////////////

    let obj = null;
    obj = await new TimeSchedule().save(); obj.destroy();

    obj = await new Reader().save(); obj.destroy();
    obj = await new Door().save(); obj.destroy();
    obj = await new Floor().save(); obj.destroy();
    obj = await new Elevator().save(); obj.destroy();

    obj = await new FloorGroup().save(); obj.destroy();
    obj = await new DoorGroup().save(); obj.destroy();
    obj = await new ElevatorGroup().save(); obj.destroy();

    obj = await new AccessLevel().save(); obj.destroy();
    obj = await new PermissionTable().save(); obj.destroy();
    obj = await new WorkGroup().save(); obj.destroy();
    obj = await new SyncNotification().save(); obj.destroy();

    obj = await new Member().save(); obj.destroy();
    obj = await new AttendanceRecords().save(); obj.destroy();
})();
