c:
cd \
cd "C:\Program Files\MongoDB"
md data_isap
cd data_isap
md db
cd ..
md log_isap

cd "C:\Program Files\MongoDB\Server\3.6\bin"
mongod --port 27017 --dbpath "C:\Program Files\MongoDB\data_isap" --logpath="C:\Program Files\MongoDB\log_isap\log.txt" --install --serviceName "iSap MongoDB" --serviceDisplayName "iSap MongoDB" --replSet rs0
net start "iSap MongoDB"
mongo --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
mongo --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
