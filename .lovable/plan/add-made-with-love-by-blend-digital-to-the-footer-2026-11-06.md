## Add "Made with love by Blend Digital" to the footer

Add a second small line under the copyright row in the site footer:

"Made with ♥ by Blend Digital" — "Blend Digital" links to https://blenddigital.com (opens in a new tab).

Styling matches the existing copyright text (same muted colour and size), with the heart in the brand accent colour.

### Technical details
- File: `src/components/Footer.tsx`, inside the bottom `border-t` block after the copyright `<p>`.
- Use lucide `Heart` icon (filled, `text-secondary`), anchor with `target="_blank" rel="noopener noreferrer"`.
