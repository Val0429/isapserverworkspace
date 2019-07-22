IF NOT EXIST "%ProgramW6432%/MongoDB/acs_mongo.cfg" (
set "dbPath=%ProgramW6432%\MongoDB\data_acs"
set "dbPath=%dbPath:\=/%"
set "logpath=%ProgramW6432%\MongoDB\log_acs\log.txt"
set "logpath=%logpath:\=/%" 
	(
	echo storage:
	echo     dbPath: "%dbPath%"
	echo     directoryPerDB: true
	echo     journal:
	echo         enabled: true
	echo systemLog:
	echo     destination: file
	echo     path: "%logpath%"
	echo     logAppend: true
	echo     timeStampFormat: iso8601-utc
	echo net:
	echo     bindIp: 127.0.0.1
	echo     port: 27020
	echo     wireObjectCheck : false
	echo replication:
	echo     oplogSizeMB: 1024
	echo     replSetName: "rs0"
	) > "%ProgramW6432%/MongoDB/acs_mongo.cfg"
)

if not exist "%ProgramW6432%/MongoDB/log_acs" mkdir "%ProgramW6432%/MongoDB/log_acs"
if not exist "%ProgramW6432%/MongoDB/data_acs" (
    mkdir "%ProgramW6432%/MongoDB/data_acs"    
    "%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\acs_mongo.cfg"  --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB"
    net start "ACS MongoDB"
	"%MONGODB_HOME%\mongo" --port 27020 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27020'}]})"
	"%MONGODB_HOME%\mongo" --port 27020 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
) else (
    "%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\acs_mongo.cfg"  --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB"
    net start "ACS MongoDB"    
)