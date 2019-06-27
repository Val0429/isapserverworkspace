import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';


import { APIPermissions, APIRoles, APITokens, IAPIPermissions, IAPIRoles, IAPITokens } from 'models/customRoles';

import { Reader, Door, Floor, FloorGroup, Elevator, DoorGroup, ElevatorGroup, Member, TimeSchedule, AccessLevel, PermissionTable, WorkGroup, SyncNotification, AttendanceRecords } from '../../custom/models'

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
    /// Create default roles
    let role = await new Parse.Query(Parse.Role)
        .first();
    if (!role) {
        for(var key in RoleList) {
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
        await user.save(null, { useMasterKey: true });
        console.log("Default User created.");
    }
    ////////////////////////////

    /// Create default API Tokens
    let tokens = await new Parse.Query(APITokens).first();
    if (!tokens) {
        tokens = new APITokens();   await tokens.save({ identifier: "1-1_user_Permission_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "1-1_user_Permission_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "1-2_user_Management_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "1-2_user_Management_CRUD" });

        tokens = new APITokens();   await tokens.save({ identifier: "2-1_report_member_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-2_report_door_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-3_report_doorgroup_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-4_report_card_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-5_report_contractor_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-6_report_demographic_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-7_report_attendance_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "2-8_report_visitor_R" });

        tokens = new APITokens();   await tokens.save({ identifier: "3-1_door_accesslevel_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "3-1_door_accesslevel_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "3-2_door_member_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "3-2_door_member_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "3-3_door_permissiontable_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "3-3_door_permissiontable_CRUD" });

        tokens = new APITokens();   await tokens.save({ identifier: "4-1_location_area_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "4-1_location_area_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "4-2_location_site_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "4-2_location_site_CRUD" });        
        tokens = new APITokens();   await tokens.save({ identifier: "4-3_location_region_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "4-3_location_region_CRUD" });

        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_door_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_door_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_doorgroup_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_doorgroup_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_floor_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_floor_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_elevator_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_elevator_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_reader_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "5-1_door_reader_CRUD" });

        tokens = new APITokens();   await tokens.save({ identifier: "6-1_notification_sync_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "6-1_notification_sync_CRUD" });

        tokens = new APITokens();   await tokens.save({ identifier: "7-1_system_hurmanresource_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "7-1_system_hurmanresource_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "7-2_system_license_R" });
        tokens = new APITokens();   await tokens.save({ identifier: "7-2_system_license_CRUD" });
        tokens = new APITokens();   await tokens.save({ identifier: "7-3_system_operationlog_R" });
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
