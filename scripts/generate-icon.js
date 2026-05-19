const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content of the fox pet (idle pose, simplified)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="-4 -6 40 42" shape-rendering="crispEdges">
  <g transform="translate(4,2)">
    <!-- TAIL -->
    <g transform="translate(24, 20)">
      <rect x="0" y="0" width="7" height="5" fill="#B8D8E8"/>
      <rect x="1" y="-1" width="5" height="1" fill="#A0C8DC"/>
      <rect x="2" y="-2" width="3" height="1" fill="#C8E8F5"/>
      <rect x="0" y="5" width="5" height="1" fill="#A0C8DC"/>
      <rect x="-1" y="1" width="1" height="3" fill="#A0C8DC"/>
      <rect x="7" y="1" width="1" height="3" fill="#88B8D0"/>
      <rect x="1" y="0" width="2" height="1" fill="#D8F0F8"/>
    </g>
    <!-- BODY -->
    <g>
      <rect x="8" y="10" width="16" height="14" fill="#4A3728"/>
      <rect x="9" y="11" width="14" height="12" fill="#F5E6D0"/>
      <rect x="9" y="11" width="14" height="3" fill="#FFFEF5"/>
      <rect x="9" y="21" width="14" height="2" fill="#EDD9BF"/>
      <rect x="11" y="15" width="10" height="7" fill="#FFFEF5"/>
    </g>
    <!-- HEAD -->
    <rect x="7" y="5" width="18" height="13" fill="#4A3728"/>
    <rect x="8" y="6" width="16" height="11" fill="#F5E6D0"/>
    <rect x="8" y="6" width="16" height="3" fill="#FFFEF5"/>
    <rect x="8" y="15" width="16" height="2" fill="#EDD9BF"/>
    <!-- EARS -->
    <g>
      <rect x="7" y="2" width="6" height="6" fill="#4A3728"/>
      <rect x="8" y="3" width="4" height="4" fill="#F5E6D0"/>
      <rect x="9" y="3" width="2" height="3" fill="#F5C6A0"/>
    </g>
    <g>
      <rect x="19" y="2" width="6" height="6" fill="#4A3728"/>
      <rect x="20" y="3" width="4" height="4" fill="#F5E6D0"/>
      <rect x="21" y="3" width="2" height="3" fill="#F5C6A0"/>
    </g>
    <!-- EYES -->
    <rect x="10" y="10" width="4" height="4" fill="#4A3728"/>
    <rect x="11" y="10" width="2" height="3" fill="#2A1A0E"/>
    <rect x="11" y="10" width="2" height="2" fill="#FFFEF5"/>
    <rect x="12" y="11" width="1" height="1" fill="#FFFFFF"/>
    <rect x="18" y="10" width="4" height="4" fill="#4A3728"/>
    <rect x="19" y="10" width="2" height="3" fill="#2A1A0E"/>
    <rect x="19" y="10" width="2" height="2" fill="#FFFEF5"/>
    <rect x="20" y="11" width="1" height="1" fill="#FFFFFF"/>
    <!-- NOSE -->
    <rect x="14" y="13" width="4" height="2" fill="#E8A080"/>
    <rect x="15" y="13" width="2" height="1" fill="#F0B898"/>
    <!-- MOUTH -->
    <rect x="14" y="15" width="4" height="1" fill="#D08060"/>
    <rect x="13" y="15" width="1" height="1" fill="#D08060"/>
    <rect x="18" y="15" width="1" height="1" fill="#D08060"/>
    <rect x="15" y="16" width="2" height="1" fill="#D08060"/>
    <!-- BLUSH -->
    <rect x="8" y="13" width="3" height="2" fill="#F5A0A0" opacity="0.6"/>
    <rect x="21" y="13" width="3" height="2" fill="#F5A0A0" opacity="0.6"/>
    <!-- PAWS -->
    <g>
      <rect x="10" y="23" width="4" height="3" fill="#4A3728"/>
      <rect x="11" y="23" width="2" height="2" fill="#F5C6A0"/>
    </g>
    <g>
      <rect x="18" y="23" width="4" height="3" fill="#4A3728"/>
      <rect x="19" y="23" width="2" height="2" fill="#F5C6A0"/>
    </g>
    <!-- FEET -->
    <rect x="10" y="26" width="5" height="2" fill="#4A3728"/>
    <rect x="11" y="26" width="3" height="1" fill="#F5C6A0"/>
    <rect x="17" y="26" width="5" height="2" fill="#4A3728"/>
    <rect x="18" y="26" width="3" height="1" fill="#F5C6A0"/>
  </g>
</svg>`;

async function generateIcon() {
  const pngPath = path.join(__dirname, '..', 'assets', 'icon.png');
  const icoPath = path.join(__dirname, '..', 'assets', 'icon.ico');

  // Generate 256x256 PNG
  await sharp(Buffer.from(svgContent))
    .resize(256, 256, { kernel: 'nearest' })
    .png()
    .toFile(pngPath);
  console.log('Generated:', pngPath);

  // For ICO, we'll use the PNG directly (electron-builder accepts PNG on Windows)
  // Copy PNG as ICO for now - electron-builder handles conversion
  fs.copyFileSync(pngPath, icoPath);
  console.log('Generated:', icoPath);
}

generateIcon().catch(console.error);
