c:
cd \
cd "C:\Program Files\MongoDB"
md data_evis
cd data_evis
md db
cd ..
md log_evis

cd "C:\Program Files\MongoDB\Server\3.6\bin"
mongod --port 27017 --dbpath "C:\Program Files\MongoDB\data_evis" --logpath="C:\Program Files\MongoDB\log_evis\log.txt" --install --serviceName "EVIS MongoDB" --serviceDisplayName "EVIS MongoDB" --replSet rs0
net start "EVIS MongoDB"
mongo --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
mongo --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
