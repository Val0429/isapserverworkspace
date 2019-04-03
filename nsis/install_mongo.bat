c:
cd \
cd "C:\Program Files\MongoDB"
md data_printer
cd data_printer
md db
cd ..
md log_printer

cd "C:\Program Files\MongoDB\Server\3.6\bin"
mongod --port 27017 --dbpath "C:\Program Files\MongoDB\data_printer" --logpath="C:\Program Files\MongoDB\log_printer\log.txt" --install --serviceName "iSap Printer MongoDB" --serviceDisplayName "iSap Printer MongoDB" --replSet rs0
net start "iSap Printer MongoDB"
mongo --port 27017 --eval "rs.initiate({_id : 'rs0', members : [{_id : 0, host : 'localhost:27017'}]})"
mongo --port 27017 --eval "while(true) {if (rs.status().ok) break;sleep(1000)};"
