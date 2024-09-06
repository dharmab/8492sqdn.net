---
title: "SkyEye Development Newsletter: August 2024"
summary: "The first newsletter for the SkyEye project!"
date: 2024-08-01
tags:
  - digital combat simulator
  - skyeye
---

Dear LARPers, Part-Timers and Frenemies,

Hello and welcome to the first development newsletter for the SkyEye project! These monthly posts will summarize the previous' months progress, the current status of the project, and what to expect in the near future.

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

## Background

SkyEye has been in development since October 2023. Between then and May 2024, most of the effort was spent on basics, such as the low-level networking code, application architecture, basic data models, AI model integrations, dev tooling- the boring slog of software engineering. After this there was a period of slow development where I became frustrated with trying to run a full DCS instance in my development environment. On July 20th, I ripped out the direct integration with DCS and replaced it with an integration with the Tacview exporter. This was like strapping a rocket to a bicycle- development _immediately_ surged ahead. The dev-execute-iterate cycle dropped from minutes to seconds. The result has been a massive amount of progress in the last two weeks.

## July Progress

In July, the following was completed:

- A subsystem was created to stream data from Tacview real-time telemetry or from ACMI files.
- The BOGEY DOPE, PICTURE, DECLARE and SPIKED voice commands were implemented. This is addition to the RADIO CHECK and ALPHA CHECK commands implemented in May.
- Player and developer documentation was rewritten to reflect new changes.
- A number of errors in brevity terminology and some internal calculations were fixed.
- The command parser was improved to accept a wider range of callsign formats.
- A masculine TTS voice was enabled, in addition to the existing feminine voice.
- The logger system was replaced to enhance the troubleshooting/debugging workflow.
- The code was restructured to make it easier to create, run and debug unit tests.
- Multiple quality passes were made over the code to untangle spaghetti code and document systems. In particular, the internal trackfile and radar systems were significantly improved.
- Unit test coverage was expanded.
- Multiple demos were distributed via the DCS forums, Reddit and Discord.
- Specific goals, a general plan and individual tickets were created for the upcoming Limited Availability and eventual General Availability release.

Furthermore, the following work is largely code-complete and in the manual QA process:

- An implementation of the SNAPLOCK command.
- Accounting for magnetic declination, based on the specific location and in-game date. This is especially important for the Kola map, where declination varies across the map due to proximity to the magnetic pole.
- A change to prevent the bot from rudely interrupting players who are already talking on SRS.
- Further corrections to brevity terminology.

## Future Plans

The next major goals for the project are:

1. Onboard project contributors. A few of these are software engineers who want to contribute specific enhancements; others are community domain experts who are helping interpret and clarify brevity and communication details; the majority are players who are providing both feedback and well appreciated morale.
2. Prepare the project for a Limited Availability (LA) release within the coming months. During the LA release, a small number of communities that I have existing relationships with will be invited to run the bot on their servers to find defects and collect feedback. While the LA build will be publicly available, I will only commit to providing support for participants in the LA release during that phase of development. Remember, this software is almost entirely developed by one mediocre programmer who works for a living! :D  The tickets to complete before LA are listed [here](https://github.com/dharmab/skyeye/milestone/1).
3. Take some vacation! I haven't taken a day off since the eclipse, and I need a bit of a break. :)

Lastly, I'd like to thank everyone who has expressed support, enthusiasm, and offers of assistance. I'm going to try to thank everyone I can in no particular order. I really hope I don't miss anyone!

> Marlan, Frosty, Frosty-nee, Broseph, kininja, RebelSapph, Kukiric, Cadence, Dex, Dorito, Singijeon, Bullet, Bones, Panic, Ciribob, RurouniJones, LazyBoot, Noodle, Cuckoo, nabbl, Foxtrot, Dutchie, Social 🦋, Ajdj100, Xanax, Merlin, aContingency, Corntingency, Lion, Lynx, Yoshi, Jadedcrown