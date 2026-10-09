// We embed 3D PNGs in an SVG so that we can use the same URLs for every pack
export const embedPngInSvg = (
    png: Buffer
) => `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<image width="32" height="32" xlink:href="data:image/png;base64,${png.toString(
    "base64"
)}"/>
</svg>`
