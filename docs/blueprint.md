# Crypto Watchlist Alerts — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot for tracking cryptocurrency prices with customizable alerts. Users can set price threshold and percent-change alerts, receive on-demand price checks, configure daily summaries, and manage quiet hours/cooldowns to prevent spam. The owner gains access to aggregated usage metrics and top alert statistics.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- individual crypto traders
- crypto holders

## Success criteria

- User can add/remove coins to watchlist
- User receives alerts according to configured rules
- Owner accesses read-only usage dashboard
- Users adjust quiet hours/cooldown settings
- Bot handles price feed failures silently

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with quick actions
- **Add Coin** (button, actor: user, callback: add_coin:start) — Display common coin buttons and free-text entry field
- **View List** (button, actor: user, callback: view_watchlist) — Show current watchlist with alert settings
- **Settings** (button, actor: user, callback: settings:start) — Configure quiet hours, cooldowns, and summary preferences
- **/price** (command, actor: user, command: /price) — Trigger price check for specific coin or entire watchlist
- **Enable Morning Summary** (button, actor: user, callback: summary:enable) — Configure daily price summary delivery time
- **/dashboard** (command, actor: owner, command: /dashboard) — Show aggregated usage metrics to owner

## Flows

### onboarding_flow
_Trigger:_ /start

1. Display main menu with Add Coin/View List/Settings/Price buttons
2. Handle button selections or /price command input

_Data touched:_ user_profile

### add_coin_flow
_Trigger:_ add_coin:start

1. Show common coin buttons
2. Handle button selection or free-text ticker input
3. Normalize ticker and validate
4. Display alert configuration options

_Data touched:_ watchlist_entry, user_profile

### alert_configuration_flow
_Trigger:_ configure_alerts

1. Display price threshold and percent-change configuration options
2. Collect user input for alert rules
3. Save and confirm alert settings

_Data touched:_ watchlist_entry

### price_check_flow
_Trigger:_ /price

1. Parse ticker parameter or default to 'all'
2. Fetch current prices with percent change
3. Format and deliver price information

_Data touched:_ user_profile, watchlist_entry, alert_event

### morning_summary_flow
_Trigger:_ summary:enable

1. Request preferred summary time
2. Validate time format
3. Save and confirm schedule

_Data touched:_ user_profile

### quiet_hours_flow
_Trigger:_ settings:quiet_hours

1. Display current quiet hours settings
2. Request new start/end times
3. Validate and save time window

_Data touched:_ user_profile

### owner_dashboard_flow
_Trigger:_ /dashboard

1. Fetch total users
2. Fetch total alerts fired
3. Fetch top 10 tickers by alerts
4. Format and deliver metrics summary

_Data touched:_ user_profile, alert_event

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **user_profile** _(retention: persistent)_ — Private user configuration data
  - fields: chat_id, time_zone, quiet_hours_start, quiet_hours_end, summary_time, default_cooldown_length, watchlist
- **watchlist_entry** _(retention: persistent)_ — Individual coin tracking configuration
  - fields: ticker, price_threshold_rule, percent_change_rule, enabled, last_alert_timestamp, last_alert_price
- **alert_event** _(retention: persistent)_ — Record of triggered alerts for metrics
  - fields: timestamp, user_id, ticker, old_price, new_price, percent_change, rule_type

## Integrations

- **Telegram** (required) — Bot API messaging
- **Price Feed API** (required) — Market price data
- **Owner Dashboard** (optional) — Usage metrics visualization
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /dashboard
- read-only access to aggregate metrics

## Notifications

- Price threshold alerts
- Percent-change alerts
- Daily morning summaries
- Aggregated owner metrics

## Permissions & privacy

- All user data is private and isolated
- Owner has read-only access to aggregated statistics
- No personal data shared with price feed API

## Edge cases

- Unknown/typo ticker handling
- Price feed API failures
- Quiet hours overlapping with alert triggers
- Multiple queued alerts during quiet period
- Cooldown expiration timing

## Required tests

- Add common coin via button and validate normalization
- Add custom ticker with error handling for invalid inputs
- Trigger price threshold alert and verify message format
- Trigger percent-change alert with 1-hour window
- Verify morning summary delivery during user's active hours
- Test quiet hours alert queuing and post-quiet delivery
- Validate cooldown suppression of repeated alerts

## Assumptions

- Price feed API is already implemented with retry logic
- Time zone defaults to UTC if not available from Telegram profile
- Batch delivery of queued alerts is limited to one message per trigger event
