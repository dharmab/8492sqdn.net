---
title: "SkyEye Development Newsletter: April 2025"
summary: "No fools here, just SkyEye v1.3!"
date: 2025-04-01
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to April's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

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

## April in Review

### Callsign Collation

SkyEye has a feature to automatically call out THREAT and MERGED calls to warn players about nearby hostile aircraft. Previously, SkyEye THREAT and MERGED calls would name each individual aircraft that the call applied to. For example, if a player named "Galm 1" and a player named "Yellow 14" were both threated by the same hostile aircraft, SkyEye would say:

> "Galm 1, Yellow 14, threat group bullseye...".

This is fine in small missions. However, in a larger mission with dozens of players, this led to long, cluttered calls:

> "Yellow 11, Yellow 12, Yellow 13, Yellow 14, threat group bullseye...".

To improve this, I've reprogrammed SkyEye to understand the structure of USAF-style callsigns. Now, SkyEye will collate callsigns that share a common prefix. In the above example, SkyEye will now say:

> "Yellow 1 flight, threat group bullseye...".

If the call had only applied to Yellows 11 and 13, SkyEye would instead say:

> "Yellow 11, 13, threat group bullseye...".

To use this feature, you and your friends must use so-called [Strict Callsigns](https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md#strict-callsigns), instead of free-form player names. Refer to the linked section of the player guide for details.

### New GPT4o Models

[OpenAI recently launched new models for speech-to-text and text-to-speech.](https://openai.com/index/introducing-our-next-generation-audio-models/) In particular, OpenAI claims that the new speech-to-text models have a lower error rate than the current model used by SkyEye. I investigated these models and compared them to SkyEye's current models.

Here are my findings on the speech-to-text models:

1. None of these new models can run locally, so they cannoy fully replace the current models.
1. The new speech-to-text models do not yet support a feature SkyEye uses called "prompting" which improves the accuracy of recognizing technical terminology such as aviation and air combat brevity. Because of this missing feature, the new models have a _higher_ error rate in practice compared to the current model.

After this investigation, I added support for the new speech-to-text models, but they are not used by default (they require server admins to set a configuration option) and I have warned against their use in the documentation. However, I have coded SkyEye such that if OpenAI does add prompting support for these new models, SkyEye will begin using the prompting feature immediately without requiring further code changes.

Text-to-speech is another story. The new OpenAI text-to-speech models can sound human-like at times, but mispronounce words in ways that change their meaning. For example, the models mispronounced numbers like "16000" as "One Thousand Six Hundred" (order of magnitude error), and words like "group" were often mispronounced as "gwoop" or "goop". This would cause significant conclusion, as pilots would be looking for contacts in the completely wrong volume of space. Therefore, I have chosen not to implement support for these models at this time.

## Fixes and Improvements

In March, the following was completed:

- SkyEye now understands USAF-style callsign structure and collates callsigns in THREAT and MERGED calls where possible (see above)
- SkyEye now supports GPT-4o and GPT-4o Mini transcription models hosted by OpenAI (see above)
- Fix a case where SkyEye could crash when responding to certain DECLARE requests.
- Fix a bug that could, on exceptionally rare occasions, cause some of SkyEye's threads to deadlock when reading data from SkyEye's internal trackfiles in a specific way.
- Fix a bug where data for the Tu-160 Blackjack was missing from SkyEye's internal database, causing it to assume Tu-160s were an unknown type of fighter and treating them as dangerous air to air threats rather than relatively harmless bombers.
- Previously, Discord tracing was eanbled by a configuration option called `tracing`, but the documentation and examples instead said to use the configuration option `enable-tracing`. SkyEye now accepts either of these options to enable Discord tracing.
- SkyEye no longer adds a "1 high, 1 low" fill-in for calls describing a stack of exactly two aircraft, since this fact is already implied by the two-altitude stack and "2 contacts" fill-in in such calls. This more closely matches how a real-world controller would construct such a call.
- I recently switched my primary editor from Vim to [Zed](https://zed.dev), and have added Zed settings to SkyEye.
- Various minor internal code improvements.
- Updated documentation with additional guidance on privacy and AI ethics.

## Upcoming Plans

Due to real-world activity and other projects, SkyEye development is expected to be slow in April.

One feature I may work on is a new `VECTOR TO`/`VECTOR FROM` command, for pilots to request bearing and distance to or from pre-briefed locations. This would largely re-use existing logic from the current `ALPHA CHECK` command, but also allow server administrators to define their own custom locations in addition to mission-defined locations like the bullseye. There is a challenge here in regards to how much additional context the AI models can handle without degrading text-to-speech error rates, but I think I can find a useful balance.
