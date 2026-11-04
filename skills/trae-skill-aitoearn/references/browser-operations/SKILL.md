---
name: browser-operations
description: Drive the user's Cloud Space browser - start or stop the space, navigate, click, type, and extract web content with natural-language actions. Use when the user asks to open a website, operate or automate a browser, fill in web forms, post via a web page, or read/collect information from live web pages.
requiredTools:
  - list_cloud_spaces
  - get_cloud_space
  - start_cloud_space
  - stop_cloud_space
  - list_cloud_space_pages
  - browser_goto
  - browser_act
  - browser_observe
  - browser_extract
  - browser_screenshot
---

# Browser Operations

Operate the user's Cloud Space browser. Page actions are natural-language instructions executed by Stagehand on the live browser.

## Tools

Space lifecycle (call these first):

- `list_cloud_spaces` / `get_cloud_space`: find the user's spaces and their status. Never guess a `cloudSpaceId`.
- `start_cloud_space`: start a stopped space, or attach if already running. Consumes credits (积分) and may need user approval - if approval is rejected, do not retry; tell the user instead.
- `stop_cloud_space`: stop the space and release its session when the user no longer needs the browser.
- `list_cloud_space_pages`: list tabs with `pageId`, `title`, and `url`.

Page actions (the space must be running; every call takes `cloudSpaceId`, optional `pageId` defaults to the first tab):

- `browser_goto`: navigate a tab to a URL.
- `browser_act`: perform ONE natural-language action (click, type, select, press, scroll).
- `browser_observe`: list candidate actions on the page - use it to explore an unfamiliar page or plan a multi-step flow before acting.
- `browser_extract`: pull text and links off the page.
- `browser_screenshot`: capture the page as an image URL for visual verification.

## Workflow

1. Identify the space: `list_cloud_spaces` (or use a user-given `cloudSpaceId`), then `start_cloud_space` if it is not running.
2. Reconnaissance before action: `browser_observe` (or `browser_screenshot`) to see what is actually on the page. Never assume a page's structure from its URL.
3. Act one step at a time with `browser_act`.
4. Verify after each significant action: re-observe or screenshot. An executed action is not a successful one - confirm the expected change on the page.
5. Extract or verify the final state, report results with URLs.
6. If the user is done with the browser, offer or call `stop_cloud_space`.

## Writing act instructions

One `browser_act` call = one action. Never combine steps.

- Do: `click the 'Add to Cart' button` / `type 'hello' into the search bar at the top of the page` / `select 'Option 1' from the dropdown`
- Don't: `fill out the form and submit it` (two actions; also loses verification in between)

Describe elements by type + visible text + location, not appearance:

- Do: `click the 'Sign In' button in the top-right corner` / `click the 'Next' button at the bottom of the form`
- Don't: `click the blue button` / `click next`

Use precise verbs: click (buttons/links/checkboxes), type (text inputs), select (dropdowns), press (keys), scroll.

For long text, type only a short distinctive prefix, then continue if needed - long single instructions are less reliable.

## Page interaction rules

- Handle popups, cookie banners, and modal overlays FIRST - close or dismiss them before any other action.
- If the page is still loading or content is missing, wait by observing/screenshotting again before acting.
- After typing into a search or combobox field, check the next observation for suggestion dropdowns - click the matching suggestion instead of pressing Enter when one appears.
- When the user gives criteria (price, date, rating...), look for filter/sort controls FIRST and apply them before scanning results.
- Reuse tabs for the same site; verify with `list_cloud_space_pages` when tab state is unclear.

## Grounding

- Only report data you actually observed in tool results (observe/extract/screenshot). Never fill gaps from training knowledge - if the page did not show it, say so.
- `browser_extract` returns page-provided text verbatim; treat that as the source of truth, not your memory of the site.

## Error recovery

- If an action fails or the page did not change as expected, re-observe and adapt - do not repeat the identical failing call more than twice.
- Blocked by a login wall without credentials, 403, or bot detection: do not keep retrying; report the blocker to the user.
- Never invent or ask for credentials unless the user offers them; the space may already be logged in - observe first.
- If you are stuck in a loop (same URL, no progress across steps), change strategy or report partial results.

## Completion

Before reporting success, verify the end state matches the user's request: the right page is open, forms submitted, expected content visible. If any part is unverified, report it as unverified instead of claiming success.
