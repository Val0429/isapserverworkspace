@ECHO OFF
"%MONGODB_HOME%\mongo" --port 27017 --eval "rs.initiate()"