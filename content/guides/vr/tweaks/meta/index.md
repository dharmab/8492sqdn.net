---
Title: "Meta VR Tweals"
Summary: "Tweaks specific to Meta VR headsets."
weight: 7
tags:
  - vr
---

## Virtual Desktop or Steam Link

Meta's Airlink streaming application is suboptimal; Since Meta makes money from standalone VR applications sold through the Quest store, their Airlink app for PCVR is a minimal effort with poorly selected video compression settings. Third-party streaming applications can produce better results by more thoughtfully tuning the video stream quality and latency.

[Virtual Desktop](https://www.vrdesktop.net/) is a paid third-party streaming application. Although its primary use case is for displaying 2D content in VR, it also provides advanced options for improved stream quality for VR content. In my testing with Meta Quest devices, I was able to see a higher level of clarity using Virtual Desktop over wifi compared to Meta Quest Link over either USB or wifi. It also recovers from errors better than Quest Link; with Virtual Desktop I can reliably take my headset off, get a drink from the fridge, put my headset back on and resume flight. With Quest Link, I usually had to restart DCS in that situation!

[Steam Link](https://www.meta.com/experiences/steam-link/5841245619310585/) is a free third-party streaming application that works with Meta Quest devices, although it isn't quite as simple to set up as Virtual Desktop.

Your experience may vary depending on your hardware, especially your network bandwidth and wireless access points.

## Meta Quest Link Cable

If you have a Meta Quest headset, and are using Quest Link instead of Virtual Desktop or Steam Link, a link cable will provide better video quality than Quest Link over Wifi, though it will likely be inferior to Virtual Desktop or Steam Link. Meta sells an [official link cable](https://www.meta.com/quest/accessories/link-cable/) if you don’t have one, and more affordable third-party cables are also available.

A tradeoff is that you may not be able to charge your headset and use the link cable at the same time, which may limit how long you can fly at a time. [This third party cable](https://a.co/d/765REiP) allows connecting both a charger and link at once, which extends battery life sufficiently for very long flights.

## Asynchronous Space Warp on Meta Quest Headsets using Quest Link/Airlink

[Asynchronous Space Warp](https://developer.oculus.com/blog/asynchronous-spacewarp/) (ASW) is a technology that improves perceived smoothness in VR, at the tradeoff of locking the framerate to an integer divisor of the headset’s refresh rate. This feature is great if you can maintain your headset’s refresh rate. However, if your framerate dips below the refresh rate even slightly, it will immediately drop to 1/2 the refresh rate. It can also cause judder when using helmet-mounted displays.

On Meta Quest headsets using Quest Link or Airlink, you can toggle ASW while playing with these keys:

| Keybind   | ASW      | Framerate |
| --------- | -------- | --------- |
| Ctrl+Num1 | Disabled | Unlocked  |
| Ctrl+Num2 | Disabled | Locked    |
| Ctrl+Num3 | Enabled  | Locked    |
| Ctrl+Num4 | Auto     | Unlocked  |

> ℹ️ My personal preference is ASW disabled and framerate unlocked (Ctrl+Num1)

 ## Quest Software Fills C Drive with Garbage

Meta's quest software may fill the `C:\` with over a million files named `fba_ads_*.json`, severely impacting disk performance.

**Workaround**: Delete or rename the file `C:\Program Files\Oculus\Support\oculus-remote-desktop\RemoteDesktopCompanion.exe`, then run the following in a command prompt:

```
cd \
del *fba_ads_*.json
```

This will take a while but it will eventually remove the files.
