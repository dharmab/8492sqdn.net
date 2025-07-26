Sources for [8492sqdn.net](https://www.8492sqdn.net/), a website about combat flight simulators.

## Install Tools

Install [Hugo](https://gohugo.io/installation/).

macOS: `brew install hugo`

Linux: [Install using a package manager](https://gohugo.io/installation/linux/#repository-packages)

Windows: [Install a prebuilt binary](https://gohugo.io/installation/windows/#prebuilt-binaries)

## Run the site locally

```
hugo server -w
```

## Images

Markdown images cause layout shift and break anchor scrolling with lazy loading. Use HTML `<img>` with `width` and `height` set on long pages. This reserves space and keeps anchors accurate.

Prefer WEBP format for images. It's smaller and loads faster.
