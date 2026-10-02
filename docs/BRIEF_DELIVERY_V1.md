# Watchkind Brief Delivery V1

## Purpose

A minimal first-party delivery layer for scored watch content on watchkind.co.

## Public URL contract

- Canonical watch page: `/watches/<slug>/`
- Convenience alias: `/<short-slug>/`
- Stable Brief handoff: `/briefs/<short-slug>/`
- Scored-watch index: `/watches/`
- Public methodology: `/methodology/`

For PRX:

- `/watches/tissot-prx-powermatic-80/`
- `/prx/`
- `/briefs/prx/`

## Referral contract

Supported query parameters:

- `ref`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

Example:

`/prx/?ref=creatorname&utm_source=instagram&utm_medium=creator&utm_campaign=prx_brief`

The browser stores first-touch and last-touch attribution in localStorage and carries it to the Brief redirect.

## Instrumented events

- `watch_page_view`
- `brief_open`
- `share_watch`
- `methodology_open`
- `methodology_page_view`
- `watch_index_view`

The tracking helper writes an in-browser queue and also pushes the same event into `window.dataLayer`. If a future collector endpoint is configured through `window.WK_ANALYTICS_ENDPOINT` or `data-analytics-endpoint`, the helper can send the same event envelope without changing page markup.

Important: pure GitHub Pages has no writable server-side event store. Until an analytics receiver is configured, events are instrumented and locally queued but are not centrally aggregated.

## PDF hosting

V1 uses Google Drive behind the first-party Brief URL. The Drive destination is intentionally isolated in the redirect page so the public Watchkind URL can remain stable if storage changes later.

## Adding the next watch

1. Add `data/watches/<slug>.json`.
2. Add `watches/<slug>/index.html` using the PRX page as the template.
3. Add `briefs/<short-slug>/index.html` pointing to the approved Brief.
4. Add `<short-slug>/index.html` as a query-preserving convenience redirect.
5. Add the watch to `watches/index.html`.
6. Verify `ref` / UTM carry-through and Brief handoff.
