# Community 14: upsertBatch() (14)

**Members:** 8

## Nodes

- **ingest-cryptoscamdb** (`scripts_ingest_ingest_cryptoscamdb_ts`, File, degree: 7)
- **fetchAddresses()** (`scripts_ingest_ingest_cryptoscamdb_ts_fetchaddresses`, Function, degree: 2)
- **getSupabaseClient()** (`scripts_ingest_ingest_cryptoscamdb_ts_getsupabaseclient`, Function, degree: 2)
- **@supabase/supabase-js/createClient** (`scripts_ingest_ingest_cryptoscamdb_ts_import_supabase_supabase_js_createclient`, Module, degree: 1)
- **undici/Agent** (`scripts_ingest_ingest_cryptoscamdb_ts_import_undici_agent`, Module, degree: 1)
- **undici/setGlobalDispatcher** (`scripts_ingest_ingest_cryptoscamdb_ts_import_undici_setglobaldispatcher`, Module, degree: 1)
- **main()** (`scripts_ingest_ingest_cryptoscamdb_ts_main`, Function, degree: 4)
- **upsertBatch()** (`scripts_ingest_ingest_cryptoscamdb_ts_upsertbatch`, Function, degree: 2)

## Relationships

- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_import_undici_agent (imports)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_import_undici_setglobaldispatcher (imports)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_import_supabase_supabase_js_createclient (imports)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_getsupabaseclient (defines)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_fetchaddresses (defines)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_upsertbatch (defines)
- scripts_ingest_ingest_cryptoscamdb_ts → scripts_ingest_ingest_cryptoscamdb_ts_main (defines)
- scripts_ingest_ingest_cryptoscamdb_ts_main → scripts_ingest_ingest_cryptoscamdb_ts_getsupabaseclient (calls)
- scripts_ingest_ingest_cryptoscamdb_ts_main → scripts_ingest_ingest_cryptoscamdb_ts_fetchaddresses (calls)
- scripts_ingest_ingest_cryptoscamdb_ts_main → scripts_ingest_ingest_cryptoscamdb_ts_upsertbatch (calls)

