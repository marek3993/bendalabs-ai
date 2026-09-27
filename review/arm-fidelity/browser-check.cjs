const {chromium}=require('C:/Users/benda/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.connectOverCDP(process.env.CDP_URL);
 const results=[];
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844],['small-mobile',320,640]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3101/robotics#ovladanie-ruky');
  const arm=page.locator('.bl-study'),model=arm.locator('svg.bl-study-svg');
  await arm.getByRole('button',{name:'Ukázať príklad',exact:true}).waitFor();
  await page.waitForTimeout(800);
  const check=async()=>{
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   const points=await model.locator('polygon').evaluateAll(elements=>elements.flatMap(el=>el.getAttribute('points').split(' ').map(p=>p.split(',').map(Number))));
   assert.ok(points.length>1000);
   const box=(await model.getAttribute('viewBox')).split(' ').map(Number);
   for(const [x,y] of points) assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=box[2]&&y>=35&&y<=box[3]-25,`Clipped geometry ${x},${y}`);
  };
  await check();
  await model.scrollIntoViewIfNeeded();
  await page.screenshot({path:`review/arm-fidelity/${name}.png`});
  await model.screenshot({path:`review/arm-fidelity/model-${name}.png`});
  for(const view of ['Z boku','Zhora','Priestorový']) {await arm.getByRole('button',{name:view,exact:true}).click();await check();}
  for(const name of ['Základňa','Rameno','Lakeť','Náklon zápästia','Rotácia zápästia','Otvorenie chápadla']) {
   const slider=arm.getByRole('slider',{name,exact:true});
   await slider.focus(); await page.keyboard.press('Home'); await check();
   await page.keyboard.press('End'); await check();
   await arm.getByRole('button',{name:'Východisková poloha',exact:true}).click();
  }
  const slider=arm.getByRole('slider',{name:'Základňa',exact:true});
  await arm.getByRole('button',{name:'Nahrať pohyb',exact:true}).click();
  await slider.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(350);
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(300);
  await arm.getByRole('button',{name:'Stop',exact:true}).click();
  const end=await slider.inputValue();
  await arm.getByRole('button',{name:'Východisková poloha',exact:true}).click();
  await arm.getByRole('button',{name:'Prehrať',exact:true}).click();
  await page.waitForTimeout(2000);assert.equal(await slider.inputValue(),end);
  await arm.getByRole('button',{name:'Ukázať príklad',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.bl-arm-task-progress')?.textContent.includes('Hotovo.'),{},{timeout:25000});
  await check();
  await model.screenshot({path:`review/arm-fidelity/cube-${name}.png`});
  assert.deepEqual(errors,[]);
  results.push({name,width,height,result:'PASS',axes:6,views:3,meshUnclipped:true,recordingPlayback:true,cubeTransfer:true,errors});
  console.log(JSON.stringify(results.at(-1)));await context.close();
 }
 fs.writeFileSync('review/arm-fidelity/browser-results.json',JSON.stringify(results,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
