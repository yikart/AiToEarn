# MCP execution

## Discover and map arguments

Discover the callable model-proxy capability by exposed name, description and public schema, commonly `call_maas_proxy` (prefixes and spelling may vary). Confirm it supports `doubao.audio_generation`; do not substitute an unrelated model tool. Use the actual discovered name. The host resolves the submitted task and returns its completed result. If this proxy capability is unavailable, report the gap.

Build the business request using this skill's bundled API reference. Select `doubao.audio_generation` through the proxy's exposed API selector. Pass the business object through its documented parameter field (commonly `maas_params`): use a JSON object if the schema accepts an object, or serialize once if it requires a string. Do not copy CLI flags, shell quoting, CLI-only controls or provider authentication headers into MCP arguments. Omit optional fields that are not needed and wrapper-fixed parameters.

## Inputs

Media references inside the model business request must resolve to accessible HTTP(S) URLs. Do not send Base64, data URLs, local paths or `mediakit://` handles as model parameters. Use MCP media references only in fields whose public schema and resolver explicitly support them and resolve them before model submission; do not assume arbitrary nested request fields are resolved. Obtain URLs for local inputs through an available authorized upload route. Use the environment's existing media reference route. If no route can provide a supported reference, report that missing capability.

Preserve signed URLs exactly and never expose credentials. When transferring results between stages, use a reference accepted by the receiving tool.

## Task lifecycle and delivery

Save the selected interface, business request and actual response in the skill's task workspace. Submit the model-proxy request as an asynchronous task and retain the actual returned `task_id`. The host resolves that same task and returns its completed result. A submission without a usable task ID is not a completed result: inspect the response and report the submission problem without inventing an ID or blindly resubmitting. A pending status, timeout, empty output or business error does not establish that MCP is unavailable.

Inspect the actual business result, including nested errors, rather than equating outer success with usable media or recognized text. Apply the result interpretation, saving, quality review and delivery rules from this skill. Do not regenerate or re-recognize to fix a download or display failure.
