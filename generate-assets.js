import fs from "fs";
import sharp from "sharp";
import path from "path";

async function generateAssets() {
  const assetsDir = path.join(process.cwd(), "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const svgContent = fs.readFileSync(path.join(process.cwd(), "public/icon.svg"), "utf8");

  console.log("Generating icon.png...");
  const fullBleedSvg = svgContent.replace('rx="128"', '');
  await sharp(Buffer.from(fullBleedSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, "icon.png"));

  console.log("Generating splash.png...");
  await sharp(Buffer.from(svgContent))
    .resize(2732, 2732, { fit: 'contain', background: { r: 2, g: 6, b: 23, alpha: 1 } })
    .png()
    .toFile(path.join(assetsDir, "splash.png"));
    
  console.log("Assets generated successfully.");
}

generateAssets().catch(console.error);
