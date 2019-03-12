c:
cd \
cd "C:\Program Files\MongoDB"
md data_ailife
cd data_ailife
md db
cd ..
md log_ailife

cd "C:\Program Files\MongoDB\Server\3.6\bin"
mongod --port 27017 --dbpath "C:\Program Files\MongoDB\data_ailife" --logpath="C:\Program Files\MongoDB\log_ailife\log.txt" --install --serviceName "AiLife MongoDB" --serviceDisplayName "AiLife MongoDB" --replSet rs0
net start "AiLife MongoDB"
mongo --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
mongo --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
