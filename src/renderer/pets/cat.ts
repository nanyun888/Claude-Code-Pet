export const cat = {
  id: 'cat',
  name: { zh: '小猫咪', en: 'Cat' },
  svg: `
    <g class="jump-rainbow">
      <rect x="8" y="30" width="2" height="1" fill="#F5A0A0"/><rect x="10" y="30" width="2" height="1" fill="#F5C6A0"/>
      <rect x="12" y="30" width="2" height="1" fill="#F5E0A0"/><rect x="14" y="30" width="2" height="1" fill="#A0D8A0"/>
      <rect x="16" y="30" width="2" height="1" fill="#A0C8DC"/><rect x="18" y="30" width="2" height="1" fill="#B8A0D8"/>
      <rect x="20" y="30" width="2" height="1" fill="#F5A0B8"/>
    </g>
    <g class="tail-group" transform="translate(24, 18)">
      <rect x="0" y="0" width="3" height="6" fill="#888888"/><rect x="3" y="-1" width="3" height="4" fill="#888888"/>
      <rect x="5" y="-2" width="2" height="3" fill="#888888"/><rect x="6" y="-3" width="2" height="2" fill="#999999"/>
      <rect x="1" y="0" width="1" height="4" fill="#AAAAAA"/>
    </g>
    <g class="pet-main">
      <g class="body-normal">
        <rect x="8" y="10" width="16" height="14" fill="#666666"/><rect x="9" y="11" width="14" height="12" fill="#C8C8C8"/>
        <rect x="9" y="11" width="14" height="3" fill="#E0E0E0"/><rect x="9" y="21" width="14" height="2" fill="#B0B0B0"/>
        <rect x="11" y="15" width="10" height="7" fill="#E8E8E8"/><rect x="12" y="15" width="8" height="1" fill="#F0F0F0"/>
        <rect x="11" y="20" width="10" height="1" fill="#D0D0D0"/>
      </g>
      <g class="sleep-curl">
        <rect x="7" y="14" width="18" height="12" fill="#666666"/><rect x="8" y="15" width="16" height="10" fill="#C8C8C8"/>
        <rect x="8" y="15" width="16" height="3" fill="#E0E0E0"/><rect x="8" y="23" width="16" height="2" fill="#B0B0B0"/>
        <rect x="9" y="13" width="14" height="2" fill="#666666"/><rect x="10" y="12" width="12" height="2" fill="#666666"/>
        <rect x="10" y="13" width="12" height="1" fill="#C8C8C8"/><rect x="11" y="19" width="8" height="5" fill="#E8E8E8"/>
      </g>
      <rect x="7" y="5" width="18" height="13" fill="#666666"/><rect x="8" y="6" width="16" height="11" fill="#C8C8C8"/>
      <rect x="8" y="6" width="16" height="3" fill="#E0E0E0"/><rect x="8" y="15" width="16" height="2" fill="#B0B0B0"/>
      <rect x="7" y="10" width="2" height="4" fill="#C8C8C8"/><rect x="23" y="10" width="2" height="4" fill="#C8C8C8"/>
      <rect x="8" y="14" width="1" height="2" fill="#C8C8C8"/><rect x="23" y="14" width="1" height="2" fill="#C8C8C8"/>
      <g class="ear-l"><rect x="7" y="1" width="6" height="7" fill="#666666"/><rect x="8" y="2" width="4" height="5" fill="#C8C8C8"/><rect x="9" y="3" width="2" height="3" fill="#F5A0A0"/></g>
      <g class="ear-r"><rect x="19" y="1" width="6" height="7" fill="#666666"/><rect x="20" y="2" width="4" height="5" fill="#C8C8C8"/><rect x="21" y="3" width="2" height="3" fill="#F5A0A0"/></g>
      <g class="eye-group">
        <rect x="10" y="10" width="4" height="4" fill="#666666"/><rect x="11" y="10" width="2" height="3" fill="#2A4A2A"/>
        <rect x="11" y="10" width="2" height="2" fill="#FFFEF5"/><rect x="12" y="11" width="1" height="1" fill="#FFFFFF" class="sparkle-eye"/>
        <g class="eye-r-open"><rect x="18" y="10" width="4" height="4" fill="#666666"/><rect x="19" y="10" width="2" height="3" fill="#2A4A2A"/><rect x="19" y="10" width="2" height="2" fill="#FFFEF5"/><rect x="20" y="11" width="1" height="1" fill="#FFFFFF" class="sparkle-eye"/></g>
        <g class="eye-r-closed"><rect x="19" y="12" width="3" height="1" fill="#666666"/><rect x="20" y="11" width="1" height="1" fill="#666666"/><rect x="21" y="11" width="1" height="1" fill="#666666"/></g>
      </g>
      <rect x="15" y="13" width="2" height="1" fill="#F5A0A0"/><rect x="14" y="13" width="4" height="1" fill="#E89090"/>
      <g class="mouth-group"><rect x="14" y="15" width="4" height="1" fill="#D08060"/><rect x="13" y="15" width="1" height="1" fill="#D08060"/><rect x="18" y="15" width="1" height="1" fill="#D08060"/><rect x="15" y="16" width="2" height="1" fill="#D08060"/></g>
      <rect x="5" y="13" width="4" height="1" fill="#AAAAAA" opacity="0.6"/><rect x="5" y="14" width="3" height="1" fill="#AAAAAA" opacity="0.4"/>
      <rect x="23" y="13" width="4" height="1" fill="#AAAAAA" opacity="0.6"/><rect x="24" y="14" width="3" height="1" fill="#AAAAAA" opacity="0.4"/>
      <rect x="8" y="13" width="3" height="2" fill="#F5A0A0" class="blush" opacity="0.4"/>
      <rect x="21" y="13" width="3" height="2" fill="#F5A0A0" class="blush" opacity="0.4"/>
      <g class="nibble-cheek-r"><rect x="22" y="11" width="3" height="3" fill="#C8C8C8"/><rect x="23" y="12" width="2" height="2" fill="#C8C8C8"/><rect x="22" y="13" width="3" height="2" fill="#F5A0A0" opacity="0.5"/></g>
      <g class="paw-l"><rect x="10" y="23" width="4" height="3" fill="#666666"/><rect x="11" y="23" width="2" height="2" fill="#C8C8C8"/><rect x="11" y="24" width="1" height="1" fill="#B0B0B0"/><rect x="13" y="24" width="1" height="1" fill="#B0B0B0"/></g>
      <g class="paw-r"><rect x="18" y="23" width="4" height="3" fill="#666666"/><rect x="19" y="23" width="2" height="2" fill="#C8C8C8"/><rect x="19" y="24" width="1" height="1" fill="#B0B0B0"/><rect x="21" y="24" width="1" height="1" fill="#B0B0B0"/></g>
      <g transform="translate(20, 20)"><rect x="0" y="0" width="3" height="2" fill="#E8D090"/><rect x="1" y="0" width="1" height="1" fill="#F5E0A0"/><rect x="0" y="1" width="3" height="1" fill="#F5E0A0"/><rect x="1" y="0" width="1" height="1" fill="#FFF5D0"/></g>
      <rect class="nibble-crumb" x="18" y="24" width="1" height="1" fill="#E8D090" opacity="0"/>
      <rect class="nibble-crumb2" x="16" y="25" width="1" height="1" fill="#D4BC78" opacity="0"/>
      <rect class="nibble-crumb" x="20" y="23" width="1" height="1" fill="#E8D090" opacity="0" style="animation-delay:0.5s"/>
      <rect x="10" y="26" width="5" height="2" fill="#666666"/><rect x="11" y="26" width="3" height="1" fill="#C8C8C8"/>
      <rect x="17" y="26" width="5" height="2" fill="#666666"/><rect x="18" y="26" width="3" height="1" fill="#C8C8C8"/>
    </g>
    <g class="wink-heart" transform="translate(26, 6)"><rect x="0" y="0" width="1" height="1" fill="#F5A0B8"/><rect x="2" y="0" width="1" height="1" fill="#F5A0B8"/><rect x="0" y="1" width="3" height="1" fill="#F5A0B8"/><rect x="1" y="2" width="1" height="1" fill="#F5A0B8"/></g>
    <text class="sleep-zz" x="22" y="10" fill="#A0C8DC" font-family="monospace" font-size="4" font-weight="bold" opacity="0">Z</text>
    <text class="sleep-zz2" x="26" y="7" fill="#88B8D0" font-family="monospace" font-size="3" font-weight="bold" opacity="0">z</text>
    <g class="star-particle" opacity="0"><rect x="5" y="6" width="1" height="1" fill="#F5E0A0"/><rect x="4" y="7" width="3" height="1" fill="#F5E0A0"/><rect x="5" y="8" width="1" height="1" fill="#F5E0A0"/></g>
    <g class="star-particle" opacity="0"><rect x="26" y="4" width="1" height="1" fill="#F5E0A0"/><rect x="25" y="5" width="3" height="1" fill="#F5E0A0"/><rect x="26" y="6" width="1" height="1" fill="#F5E0A0"/></g>
    <g class="star-particle" opacity="0"><rect x="15" y="2" width="1" height="1" fill="#F5E0A0"/><rect x="14" y="3" width="3" height="1" fill="#F5E0A0"/><rect x="15" y="4" width="1" height="1" fill="#F5E0A0"/></g>
  `,
};
