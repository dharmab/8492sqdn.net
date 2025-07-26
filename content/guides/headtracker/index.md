---
title: Head Trackers
summary: Introduction to Head Tracking for Simulation Games
date: 2024-10-14
weight: 2
---
Head tracking is a technology that allow you to control the camera view in your simulator by rotating and moving your head.

Head tracking is a near-essential input for combat flight simulation games; it is extremely difficult to track an enemy in a dogfight, use helmet-mounted sights to target weapons, or fly in close formation without head tracking. **I personally consider head tracking to be more important than a HOTAS. I would rather use a gamepad and a head tracker than a HOTAS without head tracking.**

Head tracking can also enrich other types of simulation games such as civil flight simulation, sim racing, and infantry combat games like ArmA.

{{< youtube id=9wXx3vMy_AQ start=270 >}}

Originally, head tracking was pioneered by NaturalPoint with their TrackIR product. For this reason, you'll sometimes hear people say "TrackIR" to refer to any head tracking system. However, NaturalPoint TrackIR has long been surpassed in both functionality and value by the competition, so I no longer recommend purchasing new TrackIR units. Instead, check out the following:

- [SmoothTrack](https://smoothtrack.app/), : Smartphone app. Very affordable if you already have a phone with face unlock. These apps are particularly good on iPhone, since iPhones have infrared laser head tracking sensors built in, and can also use AirPods for tracking. You can also buy a used iPhone X or newer to use as a dedicated head tracking device with this app. The price of the phone and app together is comparable to a dedicated device, but then you also have a full-featured phone to use for other things.
- [JBC Head Tracker](https://jbcconsulting448679429.wordpress.com/): Older smartphone app. It's about $8 cheaper than Smoothtrack, but Smoothtrack works much better on newer iPhones than JBC Head Tracker.

> 💡 Tip: Use an inexpensive Magsafe charging stand to power your iPhone while running Smoothtrack!

- [OpenTrack NeuralNet](https://github.com/opentrack/opentrack/wiki/AI-Face-Tracking): Standard webcam based sensor. Basic, but very affordable if you already have a webcam or can purchase one inexpensively. Try both the Accela and NaturalMotion filters in OpenTrack and see if it works well for you!
- [TrackHat Sensor V2](https://www.trackhat.org/sensorv2), [Delanclip DelanCam1](https://delanclip.com/product/delancam1/): Camera based sensors that do not require wearing any special headgear.
- [Delanclip](https://delanengineering.com/), [GrassMonkey](https://grassmonkeysimulations.com/), [TrackNP](https://www.aliexpress.com/w/wholesale-tracknp.html): Infrared LED based sensors. Require wearing headgear. Good precision and relatively affordable.

I do not recommend:

- NaturalPoint TrackIR: Too expensive compared to competition. Fragile infrared light clip. Lower refresh rates than competition. Official software has not been updated in a long time, compared to OpenTrack receiving new quality of life features. No compelling reason to buy one when equivalent hardware can be had for less than half the price.
- AITrack. AITrack has not been updated in several years. Use OpenTrack NeuralNet instead.

I have heard mixed experiences about:

- Tobii Eye Tracker 5. Initially I heard from users complaining coarse and oversmoothed tracking. A real-life friend who tried to use one for flight simulation described it as feeling drunk. More recently, I have heard this improved with software updates, but I haven't been able to verify this personally.


# FAQ:

## Which Head Tracker is the Best?

There are various advantages and tradeoffs for each product, so try a few and see what works for you:

1. Do you own an iPhone with Face ID? Try Smoothtrack. Refund it if it doesn't work well for you.
1. Do you own a webcam? Try OpenTrack NeuralNet.
1. Do you own an Android Phone? Try the Android apps. Refund them if they don't work well for you.
1. Take a look at Delanclip, Grassmonkey, TrackHat or a used iPhone X or newer (if you didn't already try Smoothtrack). Try whichever has the best price with shipping.

## How do you look to the side/behind you?

The head tracker amplifies your movement; typically, you configure it so physically looking at the edge of your monitor turns your in-game camera to look over your character's shoulder.

{{< youtube id=9wXx3vMy_AQ start=38 >}}

## I use VR. Do I need a head tracker?

Strictly speaking, VR fills the same purpose as head tracking. However, it may still be useful to have a head tracker:

- It's easier to learn with a head tracker, because it is easier to look at youtube videos, PDFs, and other material when using a head tracker versus using VR.
- It provides a back-up if your VR is having issues due to a software update.
