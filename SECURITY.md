# Security Policy

## Supported versions

Only the latest release gets fixes. Before reporting anything, please update to the newest APK from
[Releases](https://github.com/himsson/Codeum/releases/latest).

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Use GitHub's private reporting instead: the
[Security tab → Report a vulnerability](https://github.com/himsson/Codeum/security/advisories/new).
Only the repository owner sees it.

Tell me what you found, how to reproduce it, and what an attacker could do with it. I will answer
as soon as I can — this is a one-person project, so give it a few days.

## What is worth reporting

Codeum keeps everything on the phone, so the sensitive parts are:

- your **GitHub token** and **AI API key** — they are stored in the app's local storage and are sent
  only to GitHub and to the AI service you picked;
- your **SSH key** — it is generated inside the app's Linux environment and never leaves the phone;
- the **web preview** — it runs your pages in a sandboxed frame without access to the app itself.

If you find a way around any of that, or a way to make the app run code it should not, that is
exactly the kind of report I want.

## What is not a vulnerability

- The app runs downloaded compilers, and the APK is signed with the developer key and installed
  from outside Google Play. That is how the app works, and the README explains why.
- `targetSdk 28` is deliberate: newer Android rules forbid running downloaded programs.
