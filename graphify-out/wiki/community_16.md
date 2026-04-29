# Community 16: weiToEth()

**Members:** 7

## Nodes

- **fetchEvmTransactions()** (`lib_tracer_ts_fetchevmtransactions`, Function, degree: 2)
- **getBridgeName()** (`lib_tracer_ts_getbridgename`, Function, degree: 2)
- **isKnownExchange()** (`lib_tracer_ts_isknownexchange`, Function, degree: 2)
- **isMixerAddress()** (`lib_tracer_ts_ismixeraddress`, Function, degree: 2)
- **isSanctionedAddress()** (`lib_tracer_ts_issanctionedaddress`, Function, degree: 2)
- **traceEvm()** (`lib_tracer_ts_traceevm`, Function, degree: 9)
- **weiToEth()** (`lib_tracer_ts_weitoeth`, Function, degree: 2)

## Relationships

- lib_tracer_ts_traceevm → lib_tracer_ts_issanctionedaddress (calls)
- lib_tracer_ts_traceevm → lib_tracer_ts_fetchevmtransactions (calls)
- lib_tracer_ts_traceevm → lib_tracer_ts_ismixeraddress (calls)
- lib_tracer_ts_traceevm → lib_tracer_ts_getbridgename (calls)
- lib_tracer_ts_traceevm → lib_tracer_ts_isknownexchange (calls)
- lib_tracer_ts_traceevm → lib_tracer_ts_weitoeth (calls)

