@ECHO OFF
if not exist "%ProgramW6432%/MongoDB/log_vms" mkdir "%ProgramW6432%/MongoDB/log_vms"
if not exist "%ProgramW6432%/MongoDB/data_vms" mkdir "%ProgramW6432%/MongoDB/data_vms"
	
if exist "%ProgramW6432%\MongoDB\vms_mongo.cfg" GOTO installWConfig

:installWOConfig
echo "installWithoutConfig"
	"%MONGODB_HOME%\mongod" --port 27017 --dbpath "%ProgramW6432%\MongoDB\data_vms" --logpath="%ProgramW6432%\MongoDB\log_vms\log.txt" --install --serviceName "VMS MongoDB" --serviceDisplayName "VMS MongoDB" --replSet rs0	
GOTO commonExit

:installWConfig
echo "installWithConfig"
	"%MONGODB_HOME%\mongod" --config "%ProgramW6432%\MongoDB\vms_mongo.cfg"  --install --serviceName "VMS MongoDB" --serviceDisplayName "VMS MongoDB"			
GOTO commonExit

:commonExit
net start "VMS MongoDB"
