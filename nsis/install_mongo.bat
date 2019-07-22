PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& './add_config.ps1'"

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