if not exist "%ProgramW6432%/MongoDB/log_evis" mkdir "%ProgramW6432%/MongoDB/log_evis"
if not exist "%ProgramW6432%/MongoDB/data_evis" (
    mkdir "%ProgramW6432%/MongoDB/data_evis"    
    "%MONGODB_HOME%\mongod" --port 27017 --dbpath "%ProgramW6432%\MongoDB\data_evis" --logpath="%ProgramW6432%\MongoDB\log_evis\log.txt" --install --serviceName "EVIS MongoDB" --serviceDisplayName "EVIS MongoDB" --replSet rs0
    net start "EVIS MongoDB"
	"%MONGODB_HOME%\mongo" --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
	"%MONGODB_HOME%\mongo" --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
) else (
    "%MONGODB_HOME%\mongod" --port 27017 --dbpath "%ProgramW6432%\MongoDB\data_evis" --logpath="%ProgramW6432%\MongoDB\log_evis\log.txt" --install --serviceName "EVIS MongoDB" --serviceDisplayName "EVIS MongoDB" --replSet rs0
    net start "EVIS MongoDB"    
)