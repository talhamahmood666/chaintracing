# Community 20: normalizeChain()

**Members:** 6

## Nodes

- **scam-db** (`lib_scam_db_ts`, File, degree: 5)
- **getScamDbClient()** (`lib_scam_db_ts_getscamdbclient`, Function, degree: 3)
- **@supabase/supabase-js/createClient** (`lib_scam_db_ts_import_supabase_supabase_js_createclient`, Module, degree: 1)
- **lookupScamAddress()** (`lib_scam_db_ts_lookupscamaddress`, Function, degree: 3)
- **lookupScamAddressBatch()** (`lib_scam_db_ts_lookupscamaddressbatch`, Function, degree: 3)
- **normalizeChain()** (`lib_scam_db_ts_normalizechain`, Function, degree: 3)

## Relationships

- lib_scam_db_ts → lib_scam_db_ts_import_supabase_supabase_js_createclient (imports)
- lib_scam_db_ts → lib_scam_db_ts_getscamdbclient (defines)
- lib_scam_db_ts → lib_scam_db_ts_normalizechain (defines)
- lib_scam_db_ts → lib_scam_db_ts_lookupscamaddress (defines)
- lib_scam_db_ts → lib_scam_db_ts_lookupscamaddressbatch (defines)
- lib_scam_db_ts_lookupscamaddress → lib_scam_db_ts_normalizechain (calls)
- lib_scam_db_ts_lookupscamaddress → lib_scam_db_ts_getscamdbclient (calls)
- lib_scam_db_ts_lookupscamaddressbatch → lib_scam_db_ts_normalizechain (calls)
- lib_scam_db_ts_lookupscamaddressbatch → lib_scam_db_ts_getscamdbclient (calls)

