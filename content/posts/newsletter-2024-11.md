---
title: "SkyEye Development Newsletter: November 2024"
summary: "SkyEye: Road to v1"
date: 2024-10-31
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to November's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

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

## October in Review

In [October's newsletter](newsletter-2024-10.md) I set a primary goal to resolve a serious bug in SkyEye that caused certain players to become invisible. I also set a secondary objective to explore accessibility features.

I'm happy to report that, thanks to a combination of tuned logging, a new Discord tracing feature, profiling and Go's [data race detector](https://go.dev/doc/articles/race_detector), **all outstanding bugs in SkyEye have been addressed.** The bot is now running for long periods of time without demonstrating any known issues!

Additionally, the first accessibility feature is now available in the prerelease builds - server admins can now optionally connect SkyEye to DCS-gRPC, enabling players to send GCI requests through the in-game chat system. This is a useful feature for anyone who cannot use their voice to talk to SkyEye. I'm sure any gamer parents who have sleeping kids will like this feature! Note: Due to a scripting limitation, the F10 menu wasn't usable for this- third party code cannot determine the exact aircraft/player that selects an F10 menu command in all possible cases.

## Fixes and Improvements

In October, the following was completed: 

* A tracing system was implemented that can publish trace reports to a Discord webhook. This is useful for server admins to understand the bot's performance, and for players to see how the bot is recognizing their voices.
* Various race conditions and deadlocks were fixed, fixing a number of bugs that could cause the bot to break after running for a while.
* Added checks to ensure zeroed trackfiles are ignored in various workflows, fixing some rare bugs that could result in nonsensical radio calls.
* PICTURE computation is now delayed if FADED calls are pending computation, fixing a bug where an aircraft was announced as FADED and then included shortly afterwards in a PICTURE.
* FADED calls are now only broadcast if the hostile trackfile disappears within weapons range of a friendly aircraft.
* MERGED calls are now more succint.
* Various minor improvements to the parser to better handle cases where speech recognition marginally misheard a request. While individually small, they add up to make the bot overall noticeably more reliable.
* Minor adjustments to the bot's calls to make it sound slightly more natural in MERGED calls and when using ALTITUDE STACKS brevity.
* Voice playback speed is now more customizable.
* An experimental macOS build is now pubished on GitHub.
* Added a couple of missing aircraft to the internal database. Also adjusted the warning logged when an aircraft is missing from this database to be less spammy.
* Add an optional feature to automatically restart on an interval, delaying if players are on the bot's frequency. The main use cases are to randomly select a new voice every so often, and also restart the bot at convenient times as a proactive measure against any undiscovered issues associated with long runtimes.
* The Tacview integration was almost entirely rewritten, with significant parts being split out into a [separate reusable module](https://github.com/dharmab/goacmi). (It's a surprise tool that will help us later!)
* A new easter egg I won't spoil here :)

## The Road to v1

There are currently three open issues necessary before the v1 release:

- Use of API keys when authentication is required by DCS-gRPC. This was waiting for the official release of DCS-gRPC v0.8.0, which was released on the 28th. I expect this will be trivial to implement.
- In-game subtitles. This should be technically feasible, but will require a bit of development.
- Replace the current 50 knot speed filter with an AGL filter. This is going to require me to go into the programming cave for a bit, so keep an eye out for what I have to share next month :D

Honestly, the bot is pretty much production ready for PvE servers at this point, but I want to address the accessibility gaps and PvP use case before I slap a v1 sticker on it. I fully expect a v1.0 release this winter, likely before the end of 2024!

P.S. If you haven't already done so, be sure to try the bot out on the Flashpoint Levant server! See https://limakilo.net for details, and a link to the Discord where you can check out the tracing system in the `#gci-log` channel!
