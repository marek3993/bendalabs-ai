const sharp=require('sharp');
(async()=>{
 const label=Buffer.from('<svg width="1800" height="60"><rect width="1800" height="60" fill="#111b18"/><g fill="#e5f5eb" font-family="Arial" font-size="24"><text x="32" y="40">PRED</text><text x="932" y="40">PO</text></g></svg>');
 await sharp({create:{width:1800,height:765,channels:4,background:'#111b18'}}).composite([{input:label,top:0,left:0},{input:'review/arm-fidelity/before.png',top:60,left:0},{input:'review/robot-motion/home.png',top:60,left:900}]).png().toFile('review/arm-fidelity/before-after.png');
})();
