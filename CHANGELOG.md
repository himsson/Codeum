# Changelog

All notable changes to Codeum. Every version is also on the
[Releases](https://github.com/himsson/Codeum/releases) page, with the APK attached.

## [1.0.3] — 2026-09-20

### Added
- **Live preview for web pages.** HTML & CSS is a built-in language now; a new web project comes
  with `index.html`, `style.css` and `script.js`, and the Run button becomes "Preview". Your CSS and
  JS are inlined into the page, so relative links work. `console.log` and errors with a line number
  show up in a strip at the bottom.
- **File history.** Versions of a file are kept as you work — one when you open it, then roughly one
  every two minutes of editing, up to 20 per file. The state before a rollback is saved too.
- **Auto-closing brackets and quotes**, with a switch in settings.
- **Find and replace** in the editor.
- **SSH keys.** An ed25519 key is generated inside the app, shown in full and copied in one tap.

### Fixed
- Autocomplete crashed the interface on any CSS file.
- File history could overwrite the "before my edits" point with a fresh snapshot.

## [1.0.2] — 2026-09-20

### Added
- **A tutorial on first launch**: the screen dims, one element lights up and a card explains what it
  is for. 15 steps, restartable from settings.
- **Save a project to a file** — the project is packed into a ZIP through the system "Save as" dialog.
- **Error reports.** After a crash the next launch offers to report it: a GitHub page opens with the
  error text, the version and the device already filled in.
- **A loading screen** with the logo and a progress bar.

### Fixed
- Empty files could not be opened or switched to.
- Scrolling the symbol bar typed characters instead of scrolling.
- The bottom menu stayed hidden after the keyboard was dismissed with the back gesture.
- A back button was added to the header on every screen except home.
- New language icons on a black background.
- JavaScript is built in, but the Languages tab offered to install it.

## [1.0.1] — 2026-09-19

### Added
- **10 interface languages** with flags, picked before anything else: English, Русский, Українська,
  Deutsch, Français, Italiano, Español, Português, Polski, Türkçe.
- **A real terminal (PTY)**: `htop`, `vim`, `nano`, colours, Tab completion, `Esc` and `Ctrl` keys.
- **Real SSH** to a VPS, with the client installed on demand.
- **Autocomplete** in the editor.
- Installed languages are detected by what is actually on disk.

### Fixed
- The category row in Languages jumped back to the start after every tap.
- Sheets can be closed with a swipe down.
- Arrows come first on the key bar, then the symbols each language and terminal needs most.

## [1.0.0] — 2026-09-19

The first release: editor with highlighting and tabs, Run button, terminal, 16 languages,
projects and files, GitHub, AI helper, the "code of the day" widget, eight themes,
onboarding and in-app updates.

[1.0.3]: https://github.com/himsson/Codeum/releases/tag/v1.0.3
[1.0.2]: https://github.com/himsson/Codeum/releases/tag/v1.0.2
[1.0.1]: https://github.com/himsson/Codeum/releases/tag/v1.0.1
[1.0.0]: https://github.com/himsson/Codeum/releases/tag/v1.0.0
