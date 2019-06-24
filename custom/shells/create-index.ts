import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';


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
