# 2–3 minute demo walkthrough

Record the actual running app. Use live data after configuring the key. If showing fixtures, explicitly say “demo data” and leave the banner visible.

**0:00–0:20 — Problem and idea**
“Travel searches usually send us to long articles. Fieldnotes brings real sights into hyperDart and helps turn a shortlist into a small day plan.”

**0:20–0:55 — A real location**
Search “Things to do in Paris”. Point out the city resolved by hyperDart, category filters, radius and nearest-first results. Open a card’s directions. Explain that descriptions are shown only when the provider supplies them.

**0:55–1:20 — Category and robustness**
Search “museums in Delhi”; show the selected museum category. Change radius. Show an actual empty or error state if reproducible. Do not claim a city has no attractions merely because no provider results match.

**1:20–1:50 — Make a day**
Save three stops, open My day, use Order nearby stops, manually reorder one, and export. Explain that it uses straight-line nearest-next ordering, not street routing or travel-time prediction.

**1:50–2:15 — Responsive design**
Switch sidebar/mainline and light/dark. Explain that the mainline orientation diagram is a relative-position aid and is omitted in the narrow sidebar.

**2:15–2:45 — Engineering**
Show the Hono route without exposing secrets. Mention validation, the 20-result cap, server-only API key, timeouts, commercial-place exclusion, and the automated test command. Disclose AI assistance. Finish with the actual repository link and final published component.

Before recording: close `.dev.vars`, terminal histories containing credentials, and account/token settings. Use the hyperDart sandbox/platform for the final integration demo; the direct preview is a UI-development aid.
