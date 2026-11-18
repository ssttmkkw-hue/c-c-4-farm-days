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

1. 在田里锄地、种下萝卜、浇水。站在土块上用工具，会作用在脚下；站在田边，会作用在面前那一格。
2. 给两只鸡和牛喂饲料。喂过之后，鸡明早下蛋，牛可以挤奶。
3. 把鸡蛋、牛奶放进运送箱。金币明早到账。
4. 沿小路去青禾村，跟邻居说话，到花婶店里买种子或洒水器。
5. 回家上床睡觉。浇过水的作物长大一阶段。连续两天不浇水才会枯，枯了可以用锄头清掉。

1. Till, plant a turnip, and water it. On a soil tile the tool hits the ground under you. Beside the field, it hits the tile in front.
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
| 使用工具 / Use tool | J、Z、K，按住可连续使用 / hold to repeat |
| 互动 / Interact | E、空格、Enter |
| 快捷栏 / Hotbar | 1–8，鼠标滚轮 / mouse wheel |
| 背包 / Bag | I 或 Tab |
| 日历 / Calendar | M 或 C |
| 送礼 / Give the held item | 对话中按 G / G during dialogue |
| 关闭面板，或打开设置 / Close a panel, or open settings | Esc |

互动包括：说话、摸动物、捡蛋、挤奶、打开运送箱和箱子、在井边装水、柜台买东西、看告示板、面对床睡觉。

Interact talks, pets, picks up eggs, milks, opens the bin and the chest, fills the can, shops at the counter, reads the board, and sleeps when you face the bed.

### 鼠标 / Mouse

左键对相邻一格使用工具，右键互动。滚轮切换快捷栏。

Left click uses the tool on an adjacent tile. Right click interacts. The wheel changes the hotbar.

### 触控 / Touch

窄屏或触控设备会显示方向键、A（工具）、B（互动）、背包、日历、睡觉和菜单。睡觉键在家里会打开确认。画面顶部的 **EN / 中** 切换语言，♪ 开关声音。设置里可以强制显示或隐藏触控按钮。

On a narrow screen or a touch device, a pad appears: A uses the tool, B interacts, plus bag, calendar, sleep, and menu. The sleep button opens the confirm dialog while you are home. **EN / 中** on the top bar switches language. ♪ mutes. Settings can force the touch buttons on or off.

语言默认中文，会记住你的选择。

The default language is Chinese, and the choice is remembered.

## 时间与季节 / Time and seasons

一天从 6:00 到午夜。大约每实秒走 4 分钟游戏时间，干活还会再推进一点。22:00 会提醒你回家。午夜还在外面会在床上醒来，并失去少量金币（身上的 10%，最多 80）。体力耗尽也是同样的温和结局。

A day runs from 6:00 to midnight. About four game minutes pass each real second, and work pushes the clock a little more. At 22:00 you get a nudge to head home. At midnight you wake in bed and lose a little gold (10% of what you carry, at most 80). Running out of energy ends the day the same gentle way.

一年四季各 28 天。季节会换草地和树的颜色，店里的种子也跟着换。雨天早晨作物算浇过。前三个春天是晴天，方便熟悉。冬天不能在户外播种，动物、村子和小径上的捡拾还在。

Each season is 28 days. The grass, trees, and seed shelf change with it. On rainy mornings, crops count as watered. The first three days of spring are sunny. Winter has no outdoor planting. Animals, the village, and forage on the path stay.

| 季节 | 作物 | 生长 | 种子 / 售价 |
| --- | --- | --- | --- |
| 春 Spring | 萝卜 Turnip | 2 天 | 20 / 50 |
| 春 Spring | 卷心菜 Cabbage | 4 天 | 40 / 110 |
| 夏 Summer | 番茄 Tomato | 4 天，之后每 2 天再结 / then every 2 days | 50 / 70 |
| 夏 Summer | 玉米 Corn | 5 天 | 70 / 160 |
| 秋 Autumn | 南瓜 Pumpkin | 5 天 | 90 / 200 |
| 秋 Autumn | 地瓜 Sweet potato | 3 天 | 40 / 100 |
| 冬 Winter | 不播种，小径可捡松果 / no planting; pine cones on the path |  |  |

小径上还能捡到：春野草、夏野莓、秋蘑菇。

The path also has wild herbs in spring, berries in summer, and mushrooms in autumn.

换季时还没成熟的作物会枯掉。已经成熟的可以再收一次，过季不再续产。

When the season turns, crops that are not ready wilt. Ready ones can still be harvested once. They do not keep producing out of season.

## 动物 / Animals

鸡舍里有咕咕（Cluck）和啄啄（Peck），牛棚里有哞哞（Moo）。每天喂一份饲料。喂过的鸡次日早晨有蛋，喂过的牛可以挤奶。忘了喂就没有产出，它们不会消失。每天可以摸一次，心情会好一点，不影响产蛋产奶。

Cluck and Peck live in the coop. Moo lives in the barn. Feed each of them once a day. Fed hens have an egg the next morning. A fed cow can be milked. Skip a meal and they simply skip produce. They do not die. Petting once a day lifts their mood and does not change produce.

蛋卖 60 金，奶卖 140 金。饲料在花婶店里，10 金一份。

Eggs sell for 60 G, milk for 140 G. Aunt Hua sells feed for 10 G.

## 村民 / Villagers

好感 0–5 心。每人每天收一份礼物。喜欢的礼物加一颗心，别的食物会收下但不加心，讨厌的会礼貌地请你留着。

Friendship is 0–5 hearts. Each person accepts one gift a day. A liked gift adds a heart. Other food is accepted with no heart. A disliked gift is politely refused.

| 人 | 在哪 | 喜欢 | 不收 |
| --- | --- | --- | --- |
| 花婶 Aunt Hua | 店里，柜台后 / in the shop, behind the counter | 鸡蛋 Egg | 松果 Pine cone |
| 小梅 Mei | 村左的房子外 / outside the left house | 萝卜 Turnip | 南瓜 Pumpkin |
| 林哥 Lin | 村右 / the right side of the village | 玉米 Corn | 鸡蛋 Egg |
| 魏伯 Uncle Wei | 告示板附近 / near the bulletin | 牛奶 Milk | 番茄 Tomato |
| 桃奶奶 Granny Tao | 广场边 / by the plaza | 南瓜 Pumpkin | 玉米 Corn |

对着柜台买东西。店在 6:00 到 20:00 开门。

Face the counter to buy. The shop is open from 6:00 to 20:00.

店里还有：洒水器 680 金（每天早晨浇周围 3×3，最多 8 个，锄头可以收回）、大水壶 420 金（容量 40）、背包 360 金（16 格变 24 格）。

Also on the shelf: a sprinkler for 680 G (waters a 3×3 each morning, up to 8, the hoe picks it back up), a bigger can for 420 G (40 charges), and a backpack for 360 G (16 slots become 24).

## 存档 / Save

睡觉、每隔约 20 秒、以及关闭页面时会写入浏览器的 `localStorage`。标题画面可以继续。刷新不会丢掉农场。语言、静音和触控按钮的选择单独记住。

The game writes to `localStorage` when you sleep, about every 20 seconds, and when the page closes. Continue is on the title screen. A refresh keeps the farm. Language, mute, and the touch-button choice are stored too.

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

画面是 320×224 的内部分辨率，按整数倍放大，关闭图像平滑。调色板大约二十多种颜色。没有外部图片，也没有需要密钥的服务。

The view is 320×224 internally, scaled by whole pixels, with smoothing off. The palette is a little over twenty colors. There are no external images and no services that need a key.

自动化测试可以在页面加载后使用 `window.__farm`（例如 `newGame()`、`getState()`、`till()`、`sleep()`、`buy()`）。

Automated tests can call `window.__farm` after load (`newGame()`, `getState()`, `till()`, `sleep()`, `buy()`, and the other small hooks).
