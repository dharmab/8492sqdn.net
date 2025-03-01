---
title: "SkyEye Development Newsletter: March 2025"
summary: "If you live through February, you'll live another year"
date: 2025-03-01
tags:
  - digital combat simulator
  - skyeye
---

Hello and welcome to March's development newsletter for the SkyEye project! These monthly posts summarize new progress, the current status of the project, and what to expect in the near future.

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

## February in Review

February was disrupted by a temporary but extremely painful health issue that lasted over half the month and made it difficult for me to work (both professionally and on hobby projects). Thankfully the issue has healed up, so I expect to return to normal pace in March.

One area I was able to spend some time on was research and development into improving the synthetic voices used in SkyEye. The current voices are not bad, but they have accents that some players find difficult to understand. I've been wanting to deliver voices with relatively neutral accents. This has been a challenge because SkyEye needs a specific combination of traits:

- Voices must be permissively licensed and ethically created. Many free voices are only licensed for research or personal use. SkyEye requires voices that are free for commercial use to prevent any ambiguity; e.g. a DCS community that accepts Patreon donations could be construed as commercial use in some countries.
- Voices have to be legible when pronouncing air communication brevity. During February I experimented with some new voices which sounded great in samples of reading English prose, but when I loaded them into SkyEye they awkwardly stumbled over and mispronounced brevity.
- Voices must be usable on every operating system that SkyEye supports - Windows, Linux, and the experimental macOS build.
- Voices must be able to run fully offline. Many SkyEye users are international communities whose payment methods are not accepted by cloud service providers, so cloud-based speech generation is not a univerally acceptable solution.
- Speech generation must be able to run on CPUs, i.e. without GPU acceleration. Many DCS players have GPUs that don't support AI/ML frameworks (e.g. many previous generation AMD cards don't support ROCm), and many voice frameworks have quality issues when using frameworks other than CUDA such as ROCm, Vulkan or XPU.
- Speech generation must run in near-realtime on lightweight hardware requirements. Ideally, most players should be able to run SkyEye's speech generation on the same PC as DCS, and speech generation should take less than 1-2 seconds per 10-20 seconds of speech. This rules out some voices that sound excellent but don't run quickly on modest hardware.
- Many of the voice generation tools that satisfy the above are unmaintained and effectively abandonware, so I may have to take up some of the maintenance to ensure they continue to work on new operating systems. I'm not an expert on AI/ML systems (my day job is mostly related to Linux stuff), so it is a bit of a struggle to understand these codebases. Ideally, any tools I used are widely used and maintained, or at least simple enough that I can keep them working.
- Ideally, distributing the AI/ML framework and models to users should be easy. Currently, SkyEye embeds the voice models and the software to execute them inside itself, so server operators only have to deal with a single EXE or ELF file. Certain voices would require a more complex process where additional libraries would have to be present on the system, either shipped as separate files or installed separately by the user. This would in turn increase the complexity of installation, upgrades and troubleshooting, and potentially need future maintenance. In many cases, I don't trust the companies behind these libraries to support them longer than 3-5 years. I would like SkyEye to be a tool that continues to function 10-20 years into the future without major changes!

I spent a decent chunk of February evaluating various open source projects, frameworks, tools and models to try to find a better intersection of these qualities. I wasn't able to find anything that worked better than what's currently shipped in SkyEye, but my research is not yet complete. I still believe these are all surmountable problems, but it will take more time to improve them.

Some of you may also be wondering about support for radar detection/line of sight detection. I had produced some prototype code earlier that succesfully output TacView data, but that code made too many tradeoffs in favor of performance that made it difficult to implement some of the filters that people are interested in. I've been discussing the problem with others in the DCS community; there are other people working in this same problem space, so I'm hoping their efforts produce better tooling while I focus on some other features. I'll swing back around and make another pass at it within a few months.

## Fixes and Improvements

In February, the following was completed:

- SkyEye now understands what clan tags are and won't try to pronounce any content within brackets in your callsign. For example "[ISAF] Mobius 1" is now pronouced as "Mobius 1" instead of "ISAF Mobius 1". 
- Responses to DECLARE requests now correctly include fill-in information (the number of hostiles/friendlies, the type of aircraft, whether the contact is considered fast/very fast/high)
- When SkyEye sees a hostile aircraft disappear near a friendly aircraft, it doesn't make a FADED call immediately. It waits a short time to see if any other hostiles disappear, and after the picture settles, it will broadcast a condensed set of FADED calls. This declutters the channel by broadcasting a single FADED call for each destroyed hostile group instead of separate calls for each destroyed aircraft. However, this could lead to an issue where the players "get a killstreak" and chain together a large queue of hostile aircraft, which were then all announced in a massive string of FADED calls that overwhelmed the channel. The algorithm used to condense these calls has been adjusted to mitigate this issue; it might still occur, but it should be less frequent and intense when it does.
- Add an optional inter-process lock feature for squadrons who run multiple instances of SkyEye on the same CPU. This feature may reduce CPU contention at the tradeoff of a slight delay in responses when contention is happening. See the [admin documentation](https://github.com/dharmab/skyeye/blob/main/docs/ADMIN.md#multiple-instances-experimental) for techincal details.
- Fix a bug that caused SkyEye's voices to play about 8% faster and higher pitched than intended. If you preferred the faster playback speech, you can adjust the speed using the `voice-playback-speed` config option, and the correct pitch will be preserved.
- Fix a bug where SkyEye could inform players flying over hostile parked aircraft on the ground that they were in a merge. (Missing speed filter in a particular workflow.)
- Minor improvements to parser. These improvements are more marginal than in previous months as the parser's success rate has reached quite good levels!
- Various updates to documentation including better instructions on how to update to new versions of SkyEye.
- SkyEye is now compiled using Go 1.24; this update may have improved overall performance very slightly thanks to improvements to the compiler. Some of the new language features are also used within the codebase.

## Upcoming Plans

The next feature I plan to work on consolidation player callsigns. That is, instead of saying "Mobius 11, Mobius 12, Mobius 13, Mobius 14, threat group..." SkyEye will say something like "Mobius 11, 12, 13, 14..." or "Mobius 1 flight...". (There are various corner cases to handle- it's not trivial, but certainly feasible.)

Meanwhile, I've also started ramping up some other projects, including a major new project for DCS- but more on that next month!
