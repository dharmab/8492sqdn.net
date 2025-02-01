---
title: "SkyEye Development Newsletter: February 2025"
summary: "Sustainment Operations"
date: 2024-12-31
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to February's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

## What is SkyEye?

[SkyEye](https://github.com/dharmab/skyeye) is a GCI bot for DCS World. It is an advanced replacement for the in-game E-2, E-3 and A-50 AI aircraft. SkyEye is a substantial improvement over the DCS AWACS:

- SkyEye offers modern voice recognition using a current-generation AI model. (Keyboard input is also supported)
- SkyEye has natural sounding voices, using a neural network to synthesize speech instead of robotically clipping together samples
- SkyEye adheres more closely to real-world phraseology and procedures instead of the incorrect brevity used by the in-game AWACS
- SkyEye supports a larger number of commands, including PICTURE (list of highest priority threats), BOGEY DOPE (information about the nearest threat), DECLARE and SNAPLOCK (IFF correlation), SPIKED (RWR correlation), and ALPHA CHECK (location correlation for pre-GPS aircraft)
- SkyEye intelligently monitors the battlespace, providing automatic THREAT, MERGED and FADED callouts to improve situational awareness

SkyEye supports both singleplayer and multiplayer use. It can be deployed:

- On your gaming PC, using OpenAI's API for cloud-based speech recognition
- On an additional PC in your home, running fully offline local speech recognition
- On a cloud server, using either local or cloud-based speech recognition

## January in Review

As I mentioned last month, I planned to cut back on development pace for a bit following the v1 release at the end of last year. While I have a relatively short changelog, I'm happy to have plenty to report on community adoption of SkyEye!

### Special K ServerBot Plugin

[DCSServerBot](https://github.com/Special-K-s-Flightsim-Bots/DCSServerBot) is an automation tool for administering DCS World servers, including various mods and tools via a plugin system. I suggested a SkyEye plugin to the maintainer, and they quickly coded one up and added it to the project! The plugin automatically configures SkyEye to use the TacView, SRS and DCS-gRPC configurations already managed by the tool, and can handle automatic SkyEye updates when I release new versions.

### Victor Romeo Sierra server

The [Victor Romeo Sierra](https://forum.dcs.world/topic/368175-launching-ai-centric-dcs-server-victor-romeo-sierra/) dynamic campaign server has added SkyEye to their server. To my knowledge, this is the second public server running SkyEye. They've given positive feedback to me, and I'm glad to see more adoption. Go check out their server!

### Fox 3 Managed Solutions

[Fox 3 Managed Solutions](https://fox3ms.com/) is a DCS server hosting company. They now offer [paid hosting for managed instances of SkyEye](https://www.fox3ms.com/product-page/skyeye-ai-gci-server-linux-server). This was a bit of a surprise - I've joked with colleagues that this [marks a milestone for me as an open source developer](https://www.youtube.com/watch?v=3_9LGSex1JY). I have to say, their pricing is pretty high! They're charging $25/month and they don't host the Whisper model for you - you have to bring your own OpenAI API key and pay OpenAI as well. For reference, there are private squadrons self-hosting SkyEye for as little as $3/month. 😊

_Disclaimer: I am not affiliated in any way with Fox 3 MS._

## Fixes and Improvements

In January, the following was completed:

* I observed a pattern where players would instinctively use BRAA format in DECLARE requests, even though the controller assumes DECLARE requests are in BULLSEYE format unless explicitly specified. This led to player confusion as SkyEye would be looking at the "wrong" place and response "Clean" instead of identifying the intended radar contact. To help hint what's happening, SkyEye now reads back the coordinate if the format is ambigous, emphaszing that the parsed coordiante is in BULLSEYE format.
* I've adjusted the parser to better understand longer request phrases like BOGEY DOPE and ALPHA CHECK in cases where Whisper interprets a single compound word instead of two words.
* Parsing of the SPIKED request has been adjusted to be a little more lenient.
* SPIKED responses now include all of the correct fill ins, similar to the BOGEY DOPE and DECLARE responses.
* Various other minor improvements to the parser. Once again, these are a lot of small changes that sum up to a noticeable improvement in recognition rates.

## Upcoming Plans

My IRL friends have recruited me into a bimonthly Warhammer 40K night and I'm in the middle of some home improvement projects (literally replaced a kitchen sink a few hours ago), so I'm going to continue taking it easy on development. You might only see one major feature a month for a while. Don't panic! SkyEye is designed to remain working far into the future with minimal maintenance. Please enjoy what's there!
