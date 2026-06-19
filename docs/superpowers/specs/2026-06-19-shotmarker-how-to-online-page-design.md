# ShotMarker Online How-To Page Design

## Goal

Add an online user instruction page for ShotMarker at `https://zhangrh.shop/shotmarker/how-to`.

## Audience

New ShotMarker users who need a quick Chinese guide for the Apple Watch to iPhone highlight workflow.

## Selected Approach

Add the page to the existing `frontend/project/shotmarker` Vite app instead of publishing a separate static HTML file. This keeps the new page under the same public ShotMarker site as `/shotmarker/support` and `/shotmarker/privacy`.

## Content

- Hero section: ShotMarker name, a short Chinese value statement, and a compact three-step flow.
- Steps:
  - Use Apple Watch to start a training session and mark good shots.
  - Open the synced iPhone training record.
  - Select the matching training video and generate a highlight.
- Tips:
  - The video should match the training time.
  - Clip range can be adjusted.
  - ShotMarker generates one highlight without manual timeline dragging.

## Assets

Reuse the existing product screenshots from `/Users/runhaozhang/Documents/project/ShotMarker/docs/how-to/assets` by copying them into `frontend/project/shotmarker/assets/how-to`.

## Routing

The new route is `/shotmarker/how-to`. Development also accepts `/how-to`, matching the existing route behavior for `/support` and `/privacy`.

## Tests

- Extend ShotMarker route tests to cover `/shotmarker/how-to` and `/how-to`.
- Add content tests for required Chinese copy and public link constants.
- Build the ShotMarker frontend and inspect the generated output.
- Preview the built page locally before publish.

## Constraints

- Do not modify unrelated `hub` files or existing uncommitted work.
- Keep the page static and self-contained inside the ShotMarker frontend project.
- Use local image assets only.
