PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& './add_config.ps1'"

if not exist "%ProgramW6432%/MongoDB/log_acs" mkdir "%ProgramW6432%/MongoDB/log_acs"
if not exist "%ProgramW6432%/MongoDB/data_acs" mkdir "%ProgramW6432%/MongoDB/data_acs"
"%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\acs_mongo.cfg" --install  --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB"
net start "ACS MongoDB"    
