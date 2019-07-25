@ECHO OFF
if not exist "%ProgramW6432%/MongoDB/log_acs" mkdir "%ProgramW6432%/MongoDB/log_acs"
if not exist "%ProgramW6432%/MongoDB/data_acs" (
	mkdir "%ProgramW6432%/MongoDB/data_acs"
	set init="true"
)
echo %init%
if exist "%ProgramW6432%\MongoDB\acs_mongo.cfg" GOTO installWConfig

:installWOConfig
echo "installWithoutConfig"
	"%MONGODB_HOME%\mongod" --port 27020 --dbpath "%ProgramW6432%\MongoDB\data_acs" --logpath="%ProgramW6432%\MongoDB\log_acs\log.txt" --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB" --replSet rs0	
	if "%init%"=="true" GOTO initRs
GOTO commonExit

:installWConfig
echo "installWithConfig"
	"%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\acs_mongo.cfg"  --install --serviceName "ACS MongoDB" --serviceDisplayName "ACS MongoDB"			
	if "%init%"=="true" GOTO initRs		
GOTO commonExit

:initRs
echo "initRs"
net start "ACS MongoDB"
"%MONGODB_HOME%\mongo" --port 27020 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27020'}]})"
"%MONGODB_HOME%\mongo" --port 27020 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
net stop "ACS MongoDB"

:commonExit
net start "ACS MongoDB"