import { waitServerReady } from './../../../core/pending-tasks';
import { Config } from './../../../core/config.gen';
import { RoleList } from './../../../core/userRoles.gen';
import { createIndex, sharedMongoDB } from './../../../helpers/parse-server/parse-helper';

waitServerReady(async () => {

    /// indexes ////////////////
    /// Kiosk
    createIndex("_User", "kioskUniqueID",
        { "data.kioskId": 1 },
        { unique: true, partialFilterExpression: { "data.kioskId": { $exists: true } } }
    );
    /// Pins
    createIndex("Pins", "pinIndex",
        { "index": 1 }
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
        for (name of [RoleList.Administrator, RoleList.SystemAdministrator]) {
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

    /// Generate pin code
    let db = await sharedMongoDB();
    let col = db.collection("Pins");
    if (await col.findOne({}) === null) {
        console.log("<PinCode> Creating...");
        console.time("<PinCode> Created");
        let pinNumbers = new Array(900000);
        for (let i=100000, j=0; i<1000000; ++i, ++j) {
            pinNumbers[j] = i;
        }
        function shuffle(array) {
            let currentIndex = array.length, temporaryValue, randomIndex;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
        }
        shuffle(pinNumbers);
        /// Batch save pin code into database
        col.insertMany(pinNumbers.map( (pin, index) => ({index, pin}) ), (err, result) => {
            console.timeEnd("<PinCode> Created");
        });
    }
    ////////////////////////////

});
