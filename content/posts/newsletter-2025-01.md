---
title: "SkyEye Development Newsletter: January 2025"
summary: "v1.0.0 and Beyond"
date: 2024-12-31
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to January's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

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

## December in Review

The goal for December was simple: Release SkyEye v1 for Linux and Windows, with complete documentation. This goal was completed. SkyEye is now stable v1 software, with complete user, administrator and developer documentation.

This includes:

- A [player guide](https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md)
- A [full guide for server administrators](https://github.com/dharmab/skyeye/blob/main/docs/ADMIN.md), plus three quick start guides for [Windows](https://github.com/dharmab/skyeye/blob/main/docs/QUICKSTART-WINDOWS.md), [Linux on Hetzner](https://github.com/dharmab/skyeye/blob/main/docs/QUICKSTART-HETZNER.md) and [Linux on Vultr](https://github.com/dharmab/skyeye/blob/main/docs/QUICKSTART-VULTR.md).
- A [contributing guide for developers](https://github.com/dharmab/skyeye/blob/main/docs/CONTRIBUTING.md)
- Complete documentation of the APIs at https://pkg.go.dev/github.com/dharmab/skyeye
- A [privacy statement](https://github.com/dharmab/skyeye/blob/main/docs/PRIVACY.md) explaining how your data is used and which parties may access your data, depending on how SkyEye is deployed.

I consider SkyEye to be production-ready software and am now providing support for the general player population via GitHub. While there are still things that can be improved, the feature set on offer is high enough in quality that I am comfortable removing the pre-release disclaimers.

## Fixes and Improvements

In December, the following was completed:

- **Added support for using the OpenAI Audio Transcription API** instead of local speech recognition, making it easier to deploy SkyEye on a single Windows machine that is also running DCS.
- Players now receive a maximum of one MERGED call every 30 seconds, instead of a separate MERGED call for each individual hostile aircraft they merge with.
- Fix a bug where a destroyed or despawned aircraft could be counted multiple times, resulting in far too many FADED calls as well as FADED calls with too many contacts counted.
- Fix a bug where friendly aircraft could be counted multiple times within a furball.
- Fix a bug where hostile groups outside the briefed minimum threat radius but within potential weapons range were not marked as threat groups in all cases. (e.g. a MiG-25 between 25 and 35 miles away from the nearest friendly aircraft was not marked as a threat.)
- Fixed a bug where SkyEye could not connect to certain versions of TacView that had a password enabled - it turns out TacView's documentation of their password hash algorithm is not correct for all versions of TacView, so the correct hash algorithm had to be reverse-engineered by observing network traffic.
- Minor adjustments to FURBALL phrasing to eliminate nonsensical descriptions, such as a "very fast" furball.
- The example cloud-init for running SkyEye on a Linux cloud server now runs SkyEye as a container instead of as a native binary. The new cloud-init is no longer specific to Ubuntu and should work on a variety of distros including the Debian family, the Red Hat family, the SUSE family, and Arch Linux.
- A number of issues were fixed with the Windows deployment tooling.
- Support for [`NO_COLOR`](https://no-color.org/), which makes logs easier to read on Windows.
- Grammar fixes for the response text included in traces published in Discord.
- Various minor improvements to speech recognition and request parsing, which are individually small but add up to noticeably better accuracy.
- A large amount of new and updated documentation.
- A large amount of polish to the codebase, refactoring packages, enabling additional code linters and documenting all public symbols. While this isn't visible to players, it is of use to other DCS modders who are studying the codebase. In particular, I've received a number of DMs asking about SkyEye's custom SRS integration, and the TacView integration has been useful example code when discussing the ACMI data format with other developers of tools for TacView.
- Fix a date-related bug in the computation of magnetic declination that caused unit test failures starting on December 31st.

## 2025 and Beyond

I am planning to take somewhat of a break from SkyEye development for a bit, to spend time on other projects (some related to DCS, some to other hobbies). I'll respond to support requests and continue to make small improvements, but I don't have any specific plans for features to release in January.

The next big feature I want to work on is updating the AI voices used in SkyEye. I've received feedback from a small number of players that the included feminine voice is difficult to understand due to the Irish accent. While I can understand it perfectly, I am also one of those people who can understand [what Limmy is saying](https://www.youtube.com/watch?v=7msoqnz2bcY), so I might not be the best judge of clarity. This is something of a [yak-shaving adventure](https://seths.blog/2005/03/dont_shave_that/) because the maintainers of the software used to generate the voices seem to be inactive and haven't responded to my messages, so I'll likely have to fork and maintain a few pieces of software myself to complete this. This will hopefully also be useful to other FOSS developers, both within and beyond the DCS community.

Lastly, if you are getting any value from SkyEye, I ask that you donate to the SimpleRadio-Standalone project. Every component within SkyEye either has a free and open source replacement or could be replaced with my own FOSS code _except_ for DCS-SRS; the only remotely viable replacement for SRS is TeamSpeak, which is both proprietary and lacks a number of quality of life features. You can donate to the SRS project using the Donate button at http://dcssimpleradio.com.
