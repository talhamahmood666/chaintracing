# Community 11: scoreAddress()

**Members:** 9

## Nodes

- **risk** (`lib_risk_ts`, File, degree: 8)
- **buildSummary()** (`lib_risk_ts_buildsummary`, Function, degree: 2)
- **getWalletFirstSeen()** (`lib_risk_ts_getwalletfirstseen`, Function, degree: 2)
- **./config/env** (`lib_risk_ts_import_config_env`, Module, degree: 1)
- **@/data/exchange-wallets.json/exchangeWallets** (`lib_risk_ts_import_data_exchange_wallets_json_exchangewallets`, Module, degree: 1)
- **./scam-db/lookupScamAddress** (`lib_risk_ts_import_scam_db_lookupscamaddress`, Module, degree: 1)
- **./tracer/Chain** (`lib_risk_ts_import_tracer_chain`, Module, degree: 1)
- **./tracer/Hop** (`lib_risk_ts_import_tracer_hop`, Module, degree: 1)
- **scoreAddress()** (`lib_risk_ts_scoreaddress`, Function, degree: 3)

## Relationships

- lib_risk_ts → lib_risk_ts_import_tracer_hop (imports)
- lib_risk_ts → lib_risk_ts_import_tracer_chain (imports)
- lib_risk_ts → lib_risk_ts_import_data_exchange_wallets_json_exchangewallets (imports)
- lib_risk_ts → lib_risk_ts_import_config_env (imports)
- lib_risk_ts → lib_risk_ts_import_scam_db_lookupscamaddress (imports)
- lib_risk_ts → lib_risk_ts_getwalletfirstseen (defines)
- lib_risk_ts → lib_risk_ts_scoreaddress (defines)
- lib_risk_ts → lib_risk_ts_buildsummary (defines)
- lib_risk_ts_scoreaddress → lib_risk_ts_getwalletfirstseen (calls)
- lib_risk_ts_scoreaddress → lib_risk_ts_buildsummary (calls)

