c:
cd \
cd "C:\Program Files\MongoDB"
md data_airbase
cd data_airbase
md db
cd ..
md log_airbase

cd "C:\Program Files\MongoDB\Server\3.6\bin"
mongod --port 27017 --dbpath "C:\Program Files\MongoDB\data_airbase" --logpath="C:\Program Files\MongoDB\log_airbase\log.txt" --install --serviceName "iSap Airbase MongoDB" --serviceDisplayName "iSap Airbase MongoDB" --replSet rs0
net start "iSap Airbase MongoDB"
mongo --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
mongo --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
