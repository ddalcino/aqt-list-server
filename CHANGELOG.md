# Changelog

## Unreleased

### Housekeeping
* Update changelog (forgot to do this before release 0.1.2)

## v0.1.2

### Bug fixes
* Show the new architectures `wasm_singlethread` and `wasm_multithread` for Qt 6.5.0,
  to bring the output in-line with what `aqtinstall` v3.1.2 can actually install (#15)
* Dependency updates (thanks @dependabot!) (#22, #23, #24, #27, #28, #29, #30, #31, #32, #35, #39, #47)
* Updates for functional/integration tests (#25, #49)
* Fix display of:
  * Qt 6.8.0
  * Android versions of Qt >= 6.7.0
  * Module names for Qt >= 6.7.0

### Features
* Add CLI commands for official Qt installers (#20)
* Add Changelog (#16)
* Add configurable settings for recommending a py7zr version (#19, #21)
* Add CLI commands for official installers (#20, #41)
* Show `sdktool` in list of supported tools
* Add arm64 hosts for Windows and Linux

## v0.1.1

### Bug fixes
* Fix bug where "Check all modules" breaks the modules list (#11)
* Fix bug where "Check all archives" breaks the archives list (#12)

### Features
* Show module details for all Qt modules and tools
* Show archive sizes (#6)
* Show action yml for install-qt-action versions 2 and 3 (#4)

### Housekeeping
* Only deploy on main branch for repository owner (#2)
* Upgrade dependencies (#1, #3, #6, #7, #9)
* Recommend use of the newest version of `aqtinstall` (#13)


## v0.1.0

Initial release
