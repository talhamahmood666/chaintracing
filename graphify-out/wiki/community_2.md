# Community 2: GET()

**Members:** 15

## Nodes

- **route** (`app_api_report_id_pdf_route_ts`, File, degree: 14)
- **GET()** (`app_api_report_id_pdf_route_ts_get`, Function, degree: 1)
- **@/lib/config** (`app_api_report_id_pdf_route_ts_import_lib_config`, Module, degree: 1)
- **@/lib/origin-check/checkOrigin** (`app_api_report_id_pdf_route_ts_import_lib_origin_check_checkorigin`, Module, degree: 1)
- **@/lib/pdf/generatePdfBuffer** (`app_api_report_id_pdf_route_ts_import_lib_pdf_generatepdfbuffer`, Module, degree: 1)
- **@/lib/pdf/ScamDbMatchEntry** (`app_api_report_id_pdf_route_ts_import_lib_pdf_scamdbmatchentry`, Module, degree: 1)
- **@/lib/rate-limit/rateLimit** (`app_api_report_id_pdf_route_ts_import_lib_rate_limit_ratelimit`, Module, degree: 1)
- **@/lib/rate-limit/rateLimits** (`app_api_report_id_pdf_route_ts_import_lib_rate_limit_ratelimits`, Module, degree: 1)
- **@/lib/risk/RiskFlag** (`app_api_report_id_pdf_route_ts_import_lib_risk_riskflag`, Module, degree: 1)
- **@/lib/supabase/getAdminClient** (`app_api_report_id_pdf_route_ts_import_lib_supabase_getadminclient`, Module, degree: 1)
- **@/lib/tracer/analyzeTimings** (`app_api_report_id_pdf_route_ts_import_lib_tracer_analyzetimings`, Module, degree: 1)
- **@/lib/tracer/Chain** (`app_api_report_id_pdf_route_ts_import_lib_tracer_chain`, Module, degree: 1)
- **@/lib/tracer/clusterWallets** (`app_api_report_id_pdf_route_ts_import_lib_tracer_clusterwallets`, Module, degree: 1)
- **@/lib/tracer/Hop** (`app_api_report_id_pdf_route_ts_import_lib_tracer_hop`, Module, degree: 1)
- **next/server/NextRequest** (`app_api_report_id_pdf_route_ts_import_next_server_nextrequest`, Module, degree: 1)

## Relationships

- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_next_server_nextrequest (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_supabase_getadminclient (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_pdf_generatepdfbuffer (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_pdf_scamdbmatchentry (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_tracer_clusterwallets (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_tracer_analyzetimings (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_tracer_hop (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_tracer_chain (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_risk_riskflag (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_rate_limit_ratelimit (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_rate_limit_ratelimits (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_origin_check_checkorigin (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_import_lib_config (imports)
- app_api_report_id_pdf_route_ts → app_api_report_id_pdf_route_ts_get (defines)

