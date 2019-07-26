@ECHO OFF
"%MONGODB_HOME%\mongo" --port 27020 --eval "rs.initiate()"