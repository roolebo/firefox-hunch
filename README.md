# firefox-hunch

A Firefox extension for [hunch]: an agent reads the page the human works
on. It implements the [browser protocol] and talks to hunch-host on the
same machine by native messaging; hunch-host serves the browser to the
agents there or on another host.

## Setup

Let the extension reach hunch-host, once: in the Hunch app, Browser,
Install for Firefox; or run

    hunch-host browser install firefox

Download the signed extension, the `.xpi` of the [latest release]. In
Firefox, open `about:addons`, the gear menu, Install Add-on From File, and
pick it.

To try changes, load `extension/manifest.json` from `about:debugging`,
This Firefox, Load Temporary Add-on instead. A temporary add-on stays
until Firefox restarts.

[hunch]: https://github.com/roolebo/hunch
[latest release]: https://github.com/roolebo/firefox-hunch/releases/latest
[browser protocol]: https://github.com/roolebo/hunch/blob/main/skills/hunch/BROWSER.md
