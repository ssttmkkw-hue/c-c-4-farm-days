# 牧场日常 / Farm Days

一款短循环的农场生活小游戏。顶视角，自己画的像素，在浏览器里就能玩。种地比《星露谷物语》少很多规矩：没有品质等级，没有职业树，作物几天就熟。

A short farming life game in the browser. Top-down, with pixel art drawn in code. Farming is simpler than Stardew Valley: no crop quality, no profession trees, and plants are ready in a few days.

灵感来自牧场生活游戏，玩法和画面都是原创的，与《牧场物语》或《星露谷物语》没有从属关系。

The tone is inspired by farming-life games. The rules and the art are original, and this project is not affiliated with Harvest Moon or Stardew Valley.

## 运行 / Run

不需要构建。在仓库根目录：

No build step. From the repo root:

```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000`。

Open `http://localhost:8000`.

## 第一天怎么过 / A first day

1. 在田里锄地、种下萝卜、浇水。工具打在面前那一格；面前不是田时，才打在脚下。黄框标出的就是这一格。
2. 给两只鸡和牛喂饲料。喂过之后，鸡明早下蛋，牛可以挤奶。
3. 把鸡蛋、牛奶放进运送箱。金币明早到账。
4. 沿小路去青禾村，跟邻居说话，到花婶店里买种子或洒水器。
5. 回家上床睡觉。浇过水的作物长大一阶段。连续两天不浇水才会枯，枯了可以用锄头清掉。

1. Till, plant a turnip, and water it. The tool hits the tile you are facing. If that tile is not soil, it hits the ground under you. The yellow box is that tile.
2. Feed both chickens and the cow. A fed hen lays in the morning. A fed cow can be milked.
3. Put the egg and milk in the shipping bin. Gold arrives at dawn.
4. Take the path to the village, talk to someone, and buy seeds or a sprinkler at Aunt Hua's.
5. Sleep in the bed at home. Watered crops advance one stage. A crop wilts only after two dry days, and the hoe clears it.

开局有 200 金、6 包萝卜种子、9 份饲料、1 枚蛋和 1 桶奶。体力 100。锄地和浇水各花 2 点，播种 1 点，收获 2 点，挤奶 4 点。走路不花体力。水壶 20 格水，井边可以装满。

You start with 200 G, 6 turnip seed packets, 9 feed, 1 egg, and 1 milk. Energy is 100. Tilling and watering cost 2, planting costs 1, harvesting costs 2, milking costs 4. Walking is free. The can holds 20 charges and refills at the well.

## 操作 / Controls

### 键盘 / Keyboard

| 操作 | 按键 |
| --- | --- |
| 移动 / Move | WASD 或方向键 / or arrow keys |
| 使用工具 / Use tool | J、Z、K。按住只重复锄头和水壶 / hold repeats the hoe and the can only |
| 互动 / Interact | E、空格、Enter |
| 快捷栏 / Hotbar | 1–8，鼠标滚轮 / mouse wheel |
| 背包 / Bag | I 或 Tab |
| 日历 / Calendar | M 或 C |
| 送礼 / Give the held item | 对话中按 G / G during dialogue |
| 关闭面板，或打开设置 / Close a panel, or open settings | Esc |

互动包括：说话、摸动物、捡蛋、挤奶、打开运送箱和背包、在井边装水、柜台买东西、看告示板、面对床睡觉。

Interact talks, pets, picks up eggs, milks, opens the bin and the bag, fills the can, shops at the counter, reads the board, and sleeps when you face the bed.

### 鼠标 / Mouse

左键对相邻一格使用工具，右键互动。滚轮切换快捷栏。

Left click uses the tool on an adjacent tile. Right click interacts. The wheel changes the hotbar.

### 触控 / Touch

窄屏或触控设备会显示方向键、A（工具）、B（互动）、背包、日历、睡觉和菜单。竖屏时它们在画面下方，横屏时方向键在左、A/B 在右。睡觉键在家里会打开确认。画面顶部的 **EN / 中** 切换语言，♪ 开关声音。设置里可以强制显示或隐藏触控按钮。

On a narrow screen or a touch device, a pad appears: A uses the tool, B interacts, plus bag, calendar, sleep, and menu. In portrait the pad sits under the picture. In landscape the pad is on the left and A/B are on the right. The sleep button opens the confirm dialog while you are home. **EN / 中** on the top bar switches language. ♪ mutes. Settings can force the touch buttons on or off.

语言默认中文，会记住你的选择。

The default language is Chinese, and the choice is remembered.

## 时间与季节 / Time and seasons

一天从 6:00 到午夜。大约每实秒走 4 分钟游戏时间，干活还会再推进一点。22:00 会提醒你回家。午夜还在外面会在床上醒来，并失去少量金币（身上的 10%，最多 80）。体力耗尽也是同样的温和结局。

A day runs from 6:00 to midnight. About four game minutes pass each real second, and work pushes the clock a little more. At 22:00 you get a nudge to head home. At midnight you wake in bed and lose a little gold (10% of what you carry, at most 80). Running out of energy ends the day the same gentle way.

一年四季各 28 天。季节会换草地和树的颜色，店里的种子也跟着换。雨天早晨作物算浇过。前三个春天是晴天，方便熟悉。冬天不能新种，枯掉的秧仍可以用锄头或手清掉。动物、村子、小径上的松果，还有花婶的热可可，都还在。日历会标出每种作物的最晚播种日。这一天仍然要每天浇水，漏浇可能赶不上换季。种得太晚会有一句提醒，地仍然种得下去。

Each season is 28 days. The grass, trees, and seed shelf change with it. On rainy mornings, crops count as watered. The first three days of spring are sunny. Winter takes no new planting, but the hoe or an empty hand can still clear a wilted stalk. Animals, the village, pine cones on the path, and Aunt Hua's hot cocoa stay. The calendar marks the last safe planting day for each crop. That day still needs watering every day. Planting later shows a warning, and the seed still goes in the ground.

| 季节 | 作物 | 生长 | 种子 / 售价 |
| --- | --- | --- | --- |
| 春 Spring | 萝卜 Turnip | 2 天 | 20 / 70 |
| 春 Spring | 卷心菜 Cabbage | 4 天 | 40 / 140 |
| 夏 Summer | 番茄 Tomato | 4 天，之后每 2 天再结 / then every 2 days | 50 / 80 |
| 夏 Summer | 玉米 Corn | 5 天 | 70 / 190 |
| 秋 Autumn | 南瓜 Pumpkin | 5 天 | 90 / 230 |
| 秋 Autumn | 地瓜 Sweet potato | 3 天 | 40 / 120 |
| 冬 Winter | 不播种。松果 25 金。热可可 30 金买、30 金卖，选中后按使用回复 30 点体力。 no planting. Pine cones 25 G. Hot cocoa is 30 G to buy and 30 G to sell; select it and press Use to regain 30 energy |  |  |

小径上还能捡到：春野草、夏野莓、秋蘑菇。

The path also has wild herbs in spring, berries in summer, and mushrooms in autumn.

换季时还没成熟的作物会枯掉。已经成熟的可以再收一次，过季不再续产。

When the season turns, crops that are not ready wilt. Ready ones can still be harvested once. They do not keep producing out of season.

## 动物 / Animals

鸡舍里有咕咕（Cluck）和啄啄（Peck），牛棚里有哞哞（Moo）。每天喂一份饲料。喂过的鸡次日早晨有蛋，喂过的牛可以挤奶。忘了喂就没有产出，它们不会消失。每天可以摸一次，心情会好一点，不影响产蛋产奶。

Cluck and Peck live in the coop. Moo lives in the barn. Feed each of them once a day. Fed hens have an egg the next morning. A fed cow can be milked. Skip a meal and they simply skip produce. They do not die. Petting once a day lifts their mood and does not change produce.

蛋卖 35 金，奶卖 90 金。饲料在花婶店里，10 金一份。只顾动物的一天是两枚蛋加一桶奶，扣掉三份饲料，净得 130 金。田是八格宽。一整行萝卜两天一熟，平均每天收四颗，扣掉种子净得 200 金，大约是动物那天的 1.5 倍。体力还够再种几行。多出来的金币可以换鸡舍新顶（1400）或家里的窗台花箱（900），这两样不增加收成。

Eggs sell for 35 G, milk for 90 G. Aunt Hua sells feed for 10 G. An animal-only day is two eggs and one pail of milk, minus three feed, which nets 130 G. The field is eight plots wide. A full row of turnips finishes every other day, so four sales a day, and after seeds that nets 200 G, about 1.5× the animal day. Energy still covers more rows. Spare gold can buy a new coop roof (1400) or a window box at home (900). Neither one adds produce.

## 村民 / Villagers

好感 0–5 心，可以是半颗。每天第一次说话加半颗心。每人每天仍只收一份礼物。喜欢的礼物加一颗心，别的食物会收下但不加心，讨厌的会礼貌地请你留着。到了 4 心，花婶会塞来一包当季种子（冬天是热可可），小梅会塞一根萝卜，桃奶奶会给一块南瓜饼。每样只给一次。

Friendship is 0–5 hearts, in half-heart steps. The first talk each day adds half a heart. Each person still accepts only one gift a day. A liked gift adds a heart. Other food is accepted with no extra heart. A disliked gift is politely refused. At 4 hearts, Aunt Hua gives a packet of this season's seeds (hot cocoa in winter), Mei gives a turnip, and Granny Tao gives a pumpkin cake. Each reward happens once.

| 人 | 在哪 | 喜欢 | 不收 |
| --- | --- | --- | --- |
| 花婶 Aunt Hua | 店里，柜台后 / in the shop, behind the counter | 鸡蛋 Egg | 松果 Pine cone |
| 小梅 Mei | 村左的房子外 / outside the left house | 萝卜 Turnip | 南瓜 Pumpkin |
| 林哥 Lin | 村右 / the right side of the village | 玉米 Corn | 鸡蛋 Egg |
| 魏伯 Uncle Wei | 告示板附近 / near the bulletin | 牛奶 Milk | 番茄 Tomato |
| 桃奶奶 Granny Tao | 广场边 / by the plaza | 南瓜 Pumpkin | 玉米 Corn |

对着柜台买东西。店在 6:00 到 20:00 开门。种子和饲料可以一次买 ×1、×5 或 ×10。

Face the counter to buy. The shop is open from 6:00 to 20:00. Seeds and feed can be bought ×1, ×5, or ×10.

店里还有：洒水器 680 金（每天早晨浇周围 3×3，最多 8 个，锄头可以收回）、大水壶 420 金（容量 40）、背包 360 金（16 格变 24 格）、鸡舍新顶 1400 金（只换样子，蛋和售价不变）、窗台花箱 900 金（只为好看，不加收成）。冬天另有热可可，30 金，选中后按使用回复体力，卖出也是 30 金。

Also on the shelf: a sprinkler for 680 G (waters a 3×3 each morning, up to 8, the hoe picks it back up), a bigger can for 420 G (40 charges), a backpack for 360 G (16 slots become 24), a coop roof for 1400 G (a new look; eggs and their price stay the same), and a window box for 900 G (flowers at home, no extra gold). In winter there is also hot cocoa for 30 G. Select it and press Use to restore energy. It sells for 30 G.

## 存档 / Save

睡觉、累倒、买下升级、每隔约 20 秒，以及关闭页面时，会写入浏览器的 `localStorage`。存档版本是 2，仍能读版本 1。存储键仍是 `farm-days-save-v1`。只认版本 1 的旧页面会安静地忽略版本 2 的存档。缺的字段会补上，动物会被拉回围栏。标题画面可以继续。已经有存档时，新的一天会先问一句，避免盖掉进度。语言、静音和触控按钮的选择单独记住。

The game writes to `localStorage` when you sleep, pass out, buy an upgrade, about every 20 seconds, and when the page closes. Saves are version 2 and still read version 1. The storage key is still `farm-days-save-v1`. A build that only understands version 1 will ignore a version 2 save. Missing fields are filled in, and animals are pulled back inside their pens. Continue is on the title screen. If a save already exists, New Game asks before it replaces that farm. Language, mute, and the touch-button choice are stored separately.

## 目录 / Layout

```
index.html
style.css
src/main.js      启动 / boot
src/data/        文案、作物、物品、对话 / strings, crops, items, dialogue
src/world/       地图与碰撞 / maps and collision
src/game/        状态、农活、动物与村民、存档 / state, chores, animals, villagers, save
src/render/      画布 / canvas
src/sprites/     程序绘制的像素 / procedural pixels
src/ui/          界面 / DOM UI
src/input/       键盘、鼠标、触控 / keyboard, mouse, touch
src/audio/       短音效和很轻的循环 / short SFX and a quiet loop
```

画面是 320×224 的内部分辨率。宽屏按整数倍放大，窄屏和触控会用小数倍。竖屏把日期栏贴在上方，横屏把农场拉高，方向键和 A/B 放在两侧。名字写在单独的一层上，按屏幕分辨率绘制，并夹在画面里面。调色板大约二十多种颜色。没有外部图片，也没有需要密钥的服务。

The view is 320×224 internally. Wide screens scale by whole pixels. Narrow and touch screens may use a fractional scale. Portrait pins the date line to the top. Landscape gives the farm the spare height and puts the pad and A/B at the sides. Nameplates are drawn on a separate layer at screen resolution and clamped inside the view. The palette is a little over twenty colors. There are no external images and no services that need a key.

## 测试 / Tests

```bash
npm test
```

`npm test` runs `node tests/unit.test.mjs`.

覆盖瞄准（站在田 A、面向田 B、锄地只翻 B）、存档迁移、售价、好感、枯萎两天，以及面板按键。`node --check` 可以检查语法。页面里的 `window.__farm` 仍给自动化用（`newGame`、`getState`、`till`、`sleep`、`buy` 等）。钩子吞掉异常时会 `console.error`，不会把错误抛到页面上。

That file covers aiming (stand on plot A, face plot B, till only B), save migration, sell prices, friendship, the two-dry-day wilt, and panel keys. `node --check` covers syntax. `window.__farm` in the page is still there for automation (`newGame`, `getState`, `till`, `sleep`, `buy`, and the other hooks). Swallowed hook errors are logged with `console.error` and are not thrown into the page.
