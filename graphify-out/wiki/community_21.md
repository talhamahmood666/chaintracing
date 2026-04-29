# Community 21: shouldLog()

**Members:** 6

## Nodes

- **logger** (`lib_logger_ts`, File, degree: 5)
- **createRequestLogger()** (`lib_logger_ts_createrequestlogger`, Function, degree: 1)
- **formatLogEntry()** (`lib_logger_ts_formatlogentry`, Function, degree: 2)
- **formatTimestamp()** (`lib_logger_ts_formattimestamp`, Function, degree: 2)
- **log()** (`lib_logger_ts_log`, Function, degree: 4)
- **shouldLog()** (`lib_logger_ts_shouldlog`, Function, degree: 2)

## Relationships

- lib_logger_ts → lib_logger_ts_shouldlog (defines)
- lib_logger_ts → lib_logger_ts_formattimestamp (defines)
- lib_logger_ts → lib_logger_ts_formatlogentry (defines)
- lib_logger_ts → lib_logger_ts_log (defines)
- lib_logger_ts → lib_logger_ts_createrequestlogger (defines)
- lib_logger_ts_log → lib_logger_ts_shouldlog (calls)
- lib_logger_ts_log → lib_logger_ts_formatlogentry (calls)
- lib_logger_ts_log → lib_logger_ts_formattimestamp (calls)

