# Community 7: upsertBatch()

**Members:** 10

## Nodes

- **ingest-ofac** (`scripts_ingest_ingest_ofac_ts`, File, degree: 9)
- **fetchAndParseXml()** (`scripts_ingest_ingest_ofac_ts_fetchandparsexml`, Function, degree: 3)
- **getSupabaseClient()** (`scripts_ingest_ingest_ofac_ts_getsupabaseclient`, Function, degree: 2)
- **@supabase/supabase-js/createClient** (`scripts_ingest_ingest_ofac_ts_import_supabase_supabase_js_createclient`, Module, degree: 1)
- **undici/Agent** (`scripts_ingest_ingest_ofac_ts_import_undici_agent`, Module, degree: 1)
- **undici/setGlobalDispatcher** (`scripts_ingest_ingest_ofac_ts_import_undici_setglobaldispatcher`, Module, degree: 1)
- **xml2js/parseStringPromise** (`scripts_ingest_ingest_ofac_ts_import_xml2js_parsestringpromise`, Module, degree: 1)
- **main()** (`scripts_ingest_ingest_ofac_ts_main`, Function, degree: 4)
- **parseChain()** (`scripts_ingest_ingest_ofac_ts_parsechain`, Function, degree: 2)
- **upsertBatch()** (`scripts_ingest_ingest_ofac_ts_upsertbatch`, Function, degree: 2)

## Relationships

- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_import_undici_agent (imports)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_import_undici_setglobaldispatcher (imports)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_import_xml2js_parsestringpromise (imports)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_import_supabase_supabase_js_createclient (imports)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_getsupabaseclient (defines)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_parsechain (defines)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_fetchandparsexml (defines)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_upsertbatch (defines)
- scripts_ingest_ingest_ofac_ts → scripts_ingest_ingest_ofac_ts_main (defines)
- scripts_ingest_ingest_ofac_ts_fetchandparsexml → scripts_ingest_ingest_ofac_ts_parsechain (calls)
- scripts_ingest_ingest_ofac_ts_main → scripts_ingest_ingest_ofac_ts_getsupabaseclient (calls)
- scripts_ingest_ingest_ofac_ts_main → scripts_ingest_ingest_ofac_ts_upsertbatch (calls)
- scripts_ingest_ingest_ofac_ts_main → scripts_ingest_ingest_ofac_ts_fetchandparsexml (calls)

