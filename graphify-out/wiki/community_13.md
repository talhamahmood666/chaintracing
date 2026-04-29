# Community 13: requireUser()

**Members:** 8

## Nodes

- **auth-helpers** (`lib_auth_helpers_ts`, File, degree: 7)
- **createClient()** (`lib_auth_helpers_ts_createclient`, Function, degree: 3)
- **getUser()** (`lib_auth_helpers_ts_getuser`, Function, degree: 3)
- **next/headers/cookies** (`lib_auth_helpers_ts_import_next_headers_cookies`, Module, degree: 1)
- **next/server/NextRequest** (`lib_auth_helpers_ts_import_next_server_nextrequest`, Module, degree: 1)
- **next/server/NextResponse** (`lib_auth_helpers_ts_import_next_server_nextresponse`, Module, degree: 1)
- **@supabase/ssr/createServerClient** (`lib_auth_helpers_ts_import_supabase_ssr_createserverclient`, Module, degree: 1)
- **requireUser()** (`lib_auth_helpers_ts_requireuser`, Function, degree: 3)

## Relationships

- lib_auth_helpers_ts → lib_auth_helpers_ts_import_supabase_ssr_createserverclient (imports)
- lib_auth_helpers_ts → lib_auth_helpers_ts_import_next_server_nextresponse (imports)
- lib_auth_helpers_ts → lib_auth_helpers_ts_import_next_server_nextrequest (imports)
- lib_auth_helpers_ts → lib_auth_helpers_ts_import_next_headers_cookies (imports)
- lib_auth_helpers_ts → lib_auth_helpers_ts_createclient (defines)
- lib_auth_helpers_ts → lib_auth_helpers_ts_requireuser (defines)
- lib_auth_helpers_ts → lib_auth_helpers_ts_getuser (defines)
- lib_auth_helpers_ts_requireuser → lib_auth_helpers_ts_createclient (calls)
- lib_auth_helpers_ts_requireuser → lib_auth_helpers_ts_getuser (calls)
- lib_auth_helpers_ts_getuser → lib_auth_helpers_ts_createclient (calls)

