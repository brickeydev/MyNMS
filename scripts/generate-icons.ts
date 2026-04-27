import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, "..", "public")
const sourceIcon = path.join(publicDir, "icon.png")

async function generateIcons() {
  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32.png", size: 32 },
    { name: "favicon-16.png", size: 16 },
  ]

  for (const { name, size } of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(publicDir, name))
    console.log(`Generated ${name} (${size}x${size})`)
  }

  await generateOgImage()
}

async function generateOgImage() {
  const ogWidth = 1200
  const ogHeight = 630
  const iconSize = 220

  const iconBuffer = await sharp(sourceIcon)
    .resize(iconSize, iconSize)
    .toBuffer()

  const textSvg = `
    <svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ogWidth}" height="${ogHeight}" fill="#5BA55B"/>
      <text
        x="700"
        y="265"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="110"
        font-weight="900"
        fill="white"
        text-anchor="start"
      >MyNMS</text>
      <text
        x="700"
        y="345"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="38"
        fill="rgba(255,255,255,0.88)"
        text-anchor="start"
      >Deine Plattform für Neumünster</text>
    </svg>
  `

  await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 4,
      background: { r: 91, g: 165, b: 91, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      {
        input: iconBuffer,
        top: Math.round((ogHeight - iconSize) / 2),
        left: 120,
      },
    ])
    .png()
    .toFile(path.join(publicDir, "og-image.png"))

  console.log("Generated og-image.png (1200x630)")
}

generateIcons().catch(console.error)
