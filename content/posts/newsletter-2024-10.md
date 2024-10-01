---
title: "SkyEye Development Newsletter: October 2024"
summary: "A Spooktober update on the SkyEye project"
date: 2024-09-30
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to October's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

## What is SkyEye?

[SkyEye](https://github.com/dharmab/skyeye) is a GCI bot. You can talk to it over the radio using SimpleRadio-Standalone, and it will tell you useful information like:

- Where are the enemy aircraft? Which are most dangerous right now?
- Is the contact I'm looking at on my radar hostile or friendly?
- How far away is the threat on my Radar Warning Receiver?
- Where am I?

What makes SkyEye cool?

- It doesn't require external, paid cloud APIs for voice recognition
- It has a high-quality voice, while still responding to you in real time
- It uses real world communication procedures wherever it makes sense to do so
- It is very flexible - it can be run in singleplayer or muliplayer, on a player's PC or on a remote server, without any modifications to the mission file

## September in Review

In [September's newsletter](newsletter-2024-09.md) I stated that the main goal for the month was to playtest the bot to discover issues related to stability, performance, and general quality.

In exciting news, **SkyEye has been running 24/7 on the [Flashpoint Levant](https://limakilo.net/#getting-started) server since September 7th!** You can read about it in the [Lima Kilo Discord](https://discord.com/channels/894586277121388584/922969507159506964/1282039840766169253). The admin team and community have been providing an ongoing playtest and feedback all month long. This contributed directly to many bugfixes in recent releases.

## Fixes and Improvements

In September, the following was completed:

- A major refactor of the SimpleRadio-Standalone integration was completed. This refactor allows the SRS integration to access both audio and client/peer data within the same functions, which unlocks development of some nteresting features.
- The bot now reconnects to the SRS server if the connection is lost without requiring a restart.
- The bot can now listen and speak on multiple frequencies simultaneously, similar to a human controller using the Simultaneous Transmission feature in SRS.
- The bot now supports the "Coalition Audio Security" server setting in SRS, which restricts entities on different coalitions from hearing each other's radio transmissions.
- Tweaked the controller to improve rate of recongition of BOGEY DOPE, RADIO CHECK and DECLARE calls.
- The PICTURE call no longer requires the player to provide their own callsign.
- When there are multiple contacts near the location of a DECLARE or SNAPLOCK call, contacts closest to the given location are prioritized when considering how to respond. (The order was previously not explicitly defined.)
- A player will no longer receive a declaration about their own aircraft from their own DECLARE or SNAPLOCK call.
- Based on SME feedback, the bot no longer uses ICAO pronunciations of digits in compass bearings.
- Trackfiles are now cleared whenever the mission changes or restarts, preventing the bot from broadcasting FADED calls for the contacts that were present in the previous mission.
- SkyEye now correctly handles partial transforms in TacView ACMI data (i.e. data frames which do not contain all three of longitude, latitude, and altitude).
- SkyEye now better handles cases where two different objects appear in TacView ACMI data using the same ID.
- An option has been added to disable logging of speech recognition results for enhanced privacy at the tradeoff of less detailed debugging information.
- Synthetic benchmarks were created and compared to real performance metrics. Based on these benchmarks, we have improved confidence that the bot is performing as well as we can expect on our current hardware.
- An autoscaler tool has been added which can monitor the bot's frequencies and calls a custom webhook to indicate if SkyEye should start or stop running based on if the SRS channels have players in them. This tool can be used to reduce the cost of running SkyEye on cloud infrastructure to extremely low levels. For example, a private squadron flying a mission one night a week could expect to pay less than $1 per month to run SkyEye on a cloud server.
- On Windows, the PowerShell supervisor script has been replaced with a bundled copy of [WinSW](https://github.com/winsw/winsw) and service configuration files.
- The container images `ghcr.io/dharmab/skyeye` and `ghcr.io/dharmab/skyeye-scaler` have been promoted from experimental to officially supported.

## Challenges for October

The biggest challenge is a known issue where certain players become invisible to SkyEye for an undetermined reason. This is a blocker for any 1.0 release and is my highest priority to address. I will be shipping a feature shortly to add a tracing system to SkyEye as well as a feature to send trace reports to a Discord webhook. Hopefully this will help identify the root cause.

Unfortunately, my only Windows PC had a hardware failure last week, so I currently cannot fully test the bot against a DCS server for debugging. I hope to have my machine working again soon, but development is mostly stalled until then.

I have also begun some exploratory work on two key accessibility features: a text input for players who cannot use voice recognition, and in-game subtitles for players who cannot hear or understand the bot's voice. Both features appear to be technically feasible and should be on track for 1.0.

Don't panic if development seems slow in October - between the PC issues, some personal time off and Spooky Season Shenanigans, I expect to spend less time on the project this month. Enjoy the Halloween holiday!
