# Community 8: rateLimit()

**Members:** 10

## Nodes

- **rate-limit** (`lib_rate_limit_ts`, File, degree: 9)
- **getClientIp()** (`lib_rate_limit_ts_getclientip`, Function, degree: 2)
- **getLimiter()** (`lib_rate_limit_ts_getlimiter`, Function, degree: 3)
- **./logger/logger** (`lib_rate_limit_ts_import_logger_logger`, Module, degree: 1)
- **next/server/NextRequest** (`lib_rate_limit_ts_import_next_server_nextrequest`, Module, degree: 1)
- **next/server/NextResponse** (`lib_rate_limit_ts_import_next_server_nextresponse`, Module, degree: 1)
- **@upstash/ratelimit/Ratelimit** (`lib_rate_limit_ts_import_upstash_ratelimit_ratelimit`, Module, degree: 1)
- **@upstash/redis/Redis** (`lib_rate_limit_ts_import_upstash_redis_redis`, Module, degree: 1)
- **initLimiters()** (`lib_rate_limit_ts_initlimiters`, Function, degree: 3)
- **rateLimit()** (`lib_rate_limit_ts_ratelimit`, Function, degree: 4)

## Relationships

- lib_rate_limit_ts → lib_rate_limit_ts_import_upstash_ratelimit_ratelimit (imports)
- lib_rate_limit_ts → lib_rate_limit_ts_import_upstash_redis_redis (imports)
- lib_rate_limit_ts → lib_rate_limit_ts_import_next_server_nextrequest (imports)
- lib_rate_limit_ts → lib_rate_limit_ts_import_next_server_nextresponse (imports)
- lib_rate_limit_ts → lib_rate_limit_ts_import_logger_logger (imports)
- lib_rate_limit_ts → lib_rate_limit_ts_initlimiters (defines)
- lib_rate_limit_ts → lib_rate_limit_ts_getlimiter (defines)
- lib_rate_limit_ts → lib_rate_limit_ts_getclientip (defines)
- lib_rate_limit_ts → lib_rate_limit_ts_ratelimit (defines)
- lib_rate_limit_ts_initlimiters → lib_rate_limit_ts_ratelimit (calls)
- lib_rate_limit_ts_getlimiter → lib_rate_limit_ts_initlimiters (calls)
- lib_rate_limit_ts_ratelimit → lib_rate_limit_ts_getclientip (calls)
- lib_rate_limit_ts_ratelimit → lib_rate_limit_ts_getlimiter (calls)

