---
title: "SkyEye Development Newsletter: September 2024"
summary: "September's newsletter for the SkyEye project!"
date: 2024-09-01
tags:
  - digital combat simulator
---

Hello and welcome to September's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

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

## August Goals

In [last month's newsletter](newsletter-2024-08.md) I outlined some short-term goals. Let's review how we did!

### Prepare for Limited Availability

SkyEye is now in the Limited Availability phase! Automated v0.X.X builds are published on GitHub. The bot is functional, although there are some performance, stability and quality issues. During the Limited Availability phase, I am not commiting to provide support except for a small group. This helps me focus my time on the most important issues. I've begun running playtest sessions on the Flashpoint Levant server from time to time.

### Onboard Project Contributors

During the month of Auguest, three contributors made their first commits into the project!

- @nabbl made a number of contributions including:
  - Support for loading configuration from a file or environment variables
  - Options to adjust speech tempo
  - An experimental port to macOS - hugely exciting as this opens the door to using Apple's Neural Engine to accelerate the software
- Marlan and I sat down together and sketched out the algorithm for anchoring PICTURE and THREAT broadcasts - my code mostly implements his ideas. He also contributed some brevity corrections to better match real-world procedures.
- Frosty-Nee did some testing of the server and contributed a fix for an issue in the setup guide.

If you'd like to try modifying or running SkyEye yourself, see the [contributing guide](https://github.com/dharmab/skyeye/blob/main/docs/CONTRIBUTING.md) and [admin guide](https://github.com/dharmab/skyeye/blob/main/docs/ADMIN.md)!

## August Progress

In August, the following was completed:

- PICTUREs are now anchored to the geographic midpoint of the combat aircraft on the blue and red coalitions, rather than to the specific aircraft asking for a PICTURE
- PICTUREs are now automatically broadcast every few minutes, if it has changed since the last broadcast/request and anyone is listening on SRS. The interval can be customized or the feature disabled via config.
- The ranking of the top 3 hostile groups by relative threat in a PICTURE broadcast has been improved.
- THREAT calls are now automatically broadcast when a hostile aircraft potentially carrying air-to-air weapons is within range of a friendly aircraft who is listening on SRS. The range at which THREAT calls are broadcast is dynamically computed based on the threat's air-to-air capabilities. THREAT calls are repeated every few minutes as long as the threat criteria are met. The interval and mandatory threat range can be customized or the feature disabled via config.
- The SNAPLOCK command (a faster version of DECLARE intended for use during a BVR timeline) has been implemented
- FADED calls are broadcast when hostile contacts disappear (destroyed/landed/despawned) if anyone is listening on SRS.
- DECLARE call coordinates can now be optionally sproken in BRAA format as an alternative to bullseye forat. For example, to ask for a declaration of a target on your nose at five miles at 10000 feet, say "Anyface, Mycallsign 1-1, declare BRAA Three-Six-Zero, Five, Ten Thousand".
- COMMS CHECK is now an acceptable alias for RADIO CHECK
- An easter egg has been added if anyone asks for a TRIPWIRE 😜
- The parser has been almost fully rewritten, with a much higher level of accuracy.
- The controller now compares similarity of the callsigns it hears on SRS to the callsigns it sees in game, allowing it to deal with slightly "misheard" callsigns. The incidents of "I could not find that contact on scope" is now massively diminshed. This is especially good news for anyone with a homonymic callsign ("Spare" is no longer misheard as "Speak", "Witch" is not longer misheard as "Which"), or a non-English callsign ("Floppa 1-1" or "Miku 1-1" are now valid callsigns).
- Magnetic declination is accounted for the in-game location and year. This is especially important on the Kola map, where declination varies across the map due to proximity to the north pole. The code handles anywhere on the Earth and up until the year 2025 in-game, so it will work correctly on new DCS maps without requiring updates.
- Major improvements to trackfile handling which improves determination of ground speed, true speed, track direction and aspect.
- Groups can now be separated in altitude. Groups spread over more than 10000 feet vertically are now reported using altitude STACKS brevity- that is, the bot provides multiple alititudes and a count of how many aircraft are at each layer of the stack.
- Altitude of friendly groups are given in Angels/Cherubs, providing additional disambiguation between friendlies and bandits.
- If a bullseye coordinate is very close to the bullseye, the controller now says "at bullseye" instead of the numeric coordinates.
- A published [privacy statement](https://github.com/dharmab/skyeye/blob/main/docs/PRIVACY.md) explains how player data, especially voice recordings, are used by the service
- SRS audio tranmission timing improved to virtually eliminate audio stutter
- There is now a brief pause between audio transmissions, breaking up long chains of messages and providing a small window for a player to interject.
- Switched from Go's standard library CLI flag parser to Cobra/Viper, which provides better help text and the ability to load configuration from environment variables and YAML/JSON files.
- Process now handles when the DCS server changes mission or restarts the mission
- Process now exits if it loses connection to SRS. A supervisor such as systemd or a provided Powershell script can then restart the bot.
- Automated builds are now published on GitHub
- An admin's guide to deploying SkyEye has been published. It includes recommended deployment strategies, hardware, and management tools such as a sample cloud-init and systemd unit for Linux and a supervisor script for Windows.
- Expanded unit test coverage, especially for request parsing and geospatial/geometric calculations
- General readability improvements to the codebase - factoring out duplicated functions, clearer internal names
- whisper.cpp is now compiled with OpenMP support, slightly improving performance on some hardware
- Experimental support for macOS and Apple Silicon
- Many, many, many smaller bugfixes and improvements!

## Future Plans

The next major goals for the project are:

1. Playtest, playtest, playtest!
2. Discover and improve issues related to the bot's stability, performance and general quality
3. Playtest, playtest, playtest!

In particular, I'd like the bot to become stable enough that server operators are comfortable letting it run unattended for weeks at a time without manual intervention.

Once again, I'd like to thank everyone who has contributed to the project, including direct code contributions, design feedback and review, participation in playtests, and general enthusiam and support. An incomplete list in no particular order:

> Marlan, Frosty, Frosty-nee, Broseph, kininja, RebelSapph, Kukiric, Cadence, Dex, Dorito, Singijeon, Bullet, Bones, Panic, Ciribob, RurouniJones, LazyBoot, Noodle, Cuckoo, nabbl, Foxtrot, Dutchie, Social 🦋, Ajdj100, Xanax, Merlin, aContingency, Corntingency, Lion, Lynx, Yoshi, Jadedcrown, Cypher, Chief, Historia, Meat