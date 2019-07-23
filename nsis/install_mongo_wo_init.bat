@ECHO OFF
if not exist "%ProgramW6432%/MongoDB/log_acs" mkdir "%ProgramW6432%/MongoDB/log_acs"
if not exist "%ProgramW6432%/MongoDB/data_acs" mkdir "%ProgramW6432%/MongoDB/data_acs"

if not exist "%ProgramW6432%\MongoDB\acs_mongo.cfg" goto installWOConfig
echo "installWithConfig"
"%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\acs_mongo.cfg"  --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB"
goto commonExit

:installWOConfig
echo "installWithOutConfig"
"%MONGODB_HOME%\mongod" --port 27020 --dbpath "%ProgramW6432%\MongoDB\data_acs" --logpath="%ProgramW6432%\MongoDB\log_acs\log.txt" --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB" --replSet rs0

:commonExit
net start "ACS MongoDB"