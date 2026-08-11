# Creston Markets — Branded Email Templates

Two HTML email templates matching the site's dark navy + gold brand, built
with table-based layout and inline styles for real-world email client
compatibility (Outlook, Gmail, Apple Mail, etc. all have inconsistent CSS
support — plain `<div>`/flexbox-based emails often break).

## Files

- `confirm-signup.html` — sent when a new user registers, asks them to confirm their email
- `reset-password.html` — sent when a user requests a password reset

## How to install these in Supabase

1. Supabase dashboard → **Authentication** → **Email Templates**
2. You'll see a template selector — pick **Confirm signup**
3. Switch to the **HTML** view/tab (not the plain preview)
4. Delete whatever's currently there, paste in the full contents of `confirm-signup.html`
5. Save
6. Repeat: select **Reset Password** template → paste in `reset-password.html` → Save

## Important — do not remove `{{ .ConfirmationURL }}`

Both templates use Supabase's templating syntax `{{ .ConfirmationURL }}` in
two places (the button link and the fallback text link). This is what
Supabase replaces with the actual working confirmation/reset link when it
sends the email — if this placeholder gets edited or removed, the email
will send but the link won't work. Everything else in the file is safe to
customize further (wording, colors, etc.) as long as this exact
placeholder stays intact in both spots.

## Testing after install

1. Trigger a real signup or password reset on the live site
2. Check the email arrives looking correct — dark background, gold accent
   badge, serif "CRESTON MARKETS" wordmark, gold button
3. **Click the actual button** to confirm the link still works (not just
   that it looks right) — this is the one thing most worth verifying
   manually rather than assuming
4. Check it in at least Gmail and one other client if possible (Outlook
   web, Apple Mail) — email rendering can genuinely differ between them,
   even with the compatibility measures built into these templates

## If something looks broken in a specific email client

The most common culprits, if you ever need to debug this further:
- **Outlook (desktop)** renders HTML differently than everything else —
  this is why the button uses a VML fallback (`<!--[if mso]>` blocks) so
  it still displays correctly there
- **Gmail** strips `<style>` blocks in some contexts — this is why every
  visually important rule is also inlined directly on each element as a
  backup, not just in the `<style>` block
