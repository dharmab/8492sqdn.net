---
title: "SkyEye Development Newsletter: December 2024"
summary: "SkyEye Development Newsletter"
date: 2024-12-01
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to December's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

## What is SkyEye?

[SkyEye](https://github.com/dharmab/skyeye) is a GCI bot. You can talk to it over the radio using SimpleRadio-Standalone - or through the in-game chat interface - and it will tell you useful information like:

- Where are the enemy aircraft? Which are most dangerous right now?
- Is the contact I'm looking at on my radar hostile or friendly?
- How far away is the threat on my Radar Warning Receiver?
- Where am I?

What makes SkyEye cool?

- It doesn't require external, paid cloud APIs for voice recognition
- It has a high-quality voice, while still responding to you in real time
- It uses real world communication procedures wherever it makes sense to do so
- It is very flexible - it can be run in singleplayer or muliplayer, on a player's PC or on a remote server, without any modifications to the mission file

## November in Review

In [November's newsletter](newsletter-2024-11.md) I set three goals:

### Use API keys when authentication is required by DCS-gRPC.

This was successfully implemented.

### Replace the Speed filter with an AGL filter.

By default, SkyEye filters out hostile aircraft which are moving slower than 50 knots. This is a useful heuristic to remove fixed-wing aircraft which are not airborne, but also removes slowly moving or hovering helicopters which should logically be visible to radar. Ideally, SkyEye should use the aircraft's height above the terrain as a filter, but TacView's official exporter for DCS does not provide the necessary data.

To provide this data, I've begun work on a companion tool, [acmi-exporter](https://github.com/dharmab/acmi-exporter). This tool bridges data between DCS-gRPC and TacView's ACMI format, allowing the data to be enriched with additional data from the DCS scripting environment. Goals for this tool include:

- Easy customization of data polling rate. This is currently possible by modifying the TacView exporter Lua scripts, but acmi-exporter makes it as easy as changing an option.
- Export altitude above ground level for all aircraft.
- Optionally omit hostile aircraft which are not detected by a friendly sensor.
- Optionally omit certain classes of units from the export, such as ground units.
- Support recording to ACMI files and streaming via real-time telemetry.

This tool is early and work-in-progress, but my dev build already produces valid ACMI files that can be played back in the official TacView client. Progress has been slower than expected; as I've previously blogged, developing against DCS-gRPC is far slower than developing against the official TacView exporter, and my real-world schedule makes it difficult to find large blocks of time for this work (versus the official exporter, with which I can knock out a feature or fix in as little as a few minutes). Expect this work to continue into 2025.

In the meantime, I've staged the code to use AGL data into SkyEye; SkyEye will intelligently use the AGL data if it is available, and fall back to the current speed filter if it is not.

### In-Game Subtitles

Unfortunately, I did not make progress on this goal in November. Expect this work to continue into 2025.

## Fixes and Improvements

In November, the following was completed: 

* Using playtest data from Flashpoint Levant, a large number of minor improvements and fixes to the command parser have summed up into a significant and noticeable improvement to speech recognition accuracy. There are too many fixes to individually list, but in general:
  * Used real-world data to expand the table used to post-process text from the speech recognition model to normalize commonly misheard keywords
  * Add post-processing to handle cases where the speech recognition model merges words together, or merges a word with a following number
* Fixed a number of grammatical and brevity issues in the bot's responses, especially:
  * Fixed phrasing issues in the Core Information Format for describing a hostile group which is currently merged with friendlies.
  * Fixed an issue where a group separated by more than 10,000 feet in altitude was reported with a single altitude instead of altitude stacks if the Core Information Format used a BRAA position instead of a bullseye position.
* DCS-gRPC integration now allows use of API key authentication
* Bot now uses AGL data instead of speed data to filter out parked and taxiing aircraft when available (AGL data source is still a work in progress)
* Players sometimes tried to check in with the bot (e.g. "Magic, Eagle 1-1, checking in"), but this is ambiguous between a radio check and an alpha check from bullseye. Added a workflow for the controller to ask for clarification in this case.
* Players sometimes attempted to DECLARE without providing the contact's position verbally. In the real world, this would be possible by using datalink to send the contact's position to the controller, but this is not possible in DCS due to a scripting limitation. The bot now responds in this case with a TIMBER SOUR message (real-world brevity to indicate that Link-16 is degraded) and hints that the player should provide the position verbally.
* A few of you encountered the easter egg when players try to use OverlordBot-specific commands such as TRIPWIRE, which are considered obsolete in SkyEye's GCI implementation. However, these workflows did not cover all possible aliases for the TRIPWIRE command that were present in the OverlordBot LUIS model. Players who used these alternate phrasings encountered confusing and frustrating generic error messages, so I've changed the workflow to:
  1. Detect the alternate phrasings for the TRIPWIRE command that were used in OverlordBot, plus additional invalid phrasings that players seem to misremember
  2. Sadly, adjust the response to this command to be less silly and more explanatory
* Added an easter egg for another obsolete OverlordBot command :)
* Updated player guide with some more tips and examples

Additionally, the following is in progress:

* I have purchased an Apple Silicon Mac and am working to promote the macOS version of SkyEye to a fully supported platform, including GPU acceleration using Metal. Initial benchmarks on the base model M4 Mac Mini are, in a word, _incredible_. SkyEye is able to respond in **real-time**, running on an affordable commodity mini PC. This work is not yet merged into the main branch because the changes to the build require rigorous testing across platforms, but this is incredibly promising for the future of SRS bots.

## 2024 and Beyond

I have decided to push the remaining DCS-gRPC features to 2025 and release a polished v1.0 before the end of the year. This is slightly less than I hoped for but due to my work schedule for December I have limited time to work on major new features. The target release date for v1.0 is December 31st, 2024. The v1.0 release will include:

* Official support for Linux and Windows
* Improved administrator documentation, including a quick start guide for setting up SkyEye on a cloud server
* Improved developer documentation, targeting 100% documentation coverage of all public interfaces
* Stretch goal: Official support for macOS
