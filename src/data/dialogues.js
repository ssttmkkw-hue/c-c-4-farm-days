const L = (zh, en) => ({ zh, en });

function pages(list) {
  return list;
}

/**
 * Each tier has two daily variants. Each variant is 2–3 short pages.
 * hearts 0–1 low, 2–3 mid, 4–5 high.
 */
export const NPC_DEFS = [
  {
    id: 'hua',
    zh: '花婶',
    en: 'Aunt Hua',
    map: 'shop',
    x: 15,
    y: 6,
    liked: 'egg',
    disliked: 'forage_cone',
    look: 'hua',
    rain: L('雨天店里更暖。种子不会淋湿。', 'The shop is warmer when it rains. The seeds stay dry.'),
    waypoints: [
      { x: 15, y: 6 },
      { x: 17, y: 6 },
      { x: 17, y: 8 },
      { x: 15, y: 8 },
    ],
    lines: {
      low: [
        pages([
          L('今天的蛋要是金黄的，我就做成蒸蛋。', 'If the eggs are golden today, I\'ll steam them.'),
          L('种子按季节摆好了，别买错呀。', 'Seeds are sorted by season. Don\'t grab the wrong ones.'),
        ]),
        pages([
          L('青禾村就这么大，脚步放慢也没关系。', 'Greengrain is small. It is all right to walk slowly.'),
          L('柜台后面的椅子，是留给聊天的。', 'The chair behind the counter is for talking, not for rushing.'),
        ]),
      ],
      mid: [
        pages([
          L('你把地照料得很好，泥土看着都高兴。', 'You look after the soil so well the dirt looks pleased.'),
          L('有空就坐坐。店不会为了你少开一扇门。', 'Sit a while. The shop will not close a door on you.'),
        ]),
        pages([
          L('饲料我单独放在下层，别跟种子混了。', 'Feed is on the lower shelf, apart from the seeds.'),
          L('洒水器不便宜，可它会替你记住浇水。', 'The sprinkler is not cheap. It remembers watering for you.'),
        ]),
      ],
      high: [
        pages([
          L('最新鲜的那包种子，我留在柜台底下了。', 'I kept the freshest packet under the counter for you.'),
          L('看着你从早忙到晚，像看一株认真的菜。', 'Watching you work is like watching a very earnest vegetable.'),
        ]),
        pages([
          L('蛋带来的话，我晚上给你留一碗。', 'Bring an egg and I\'ll save you a bowl tonight.'),
          L('你已经是这店里固定的脚步声了。', 'Your footsteps are part of the shop now.'),
        ]),
      ],
    },
  },
  {
    id: 'mei',
    zh: '小梅',
    en: 'Mei',
    map: 'village',
    x: 4,
    y: 6,
    liked: 'turnip',
    disliked: 'pumpkin',
    look: 'mei',
    rain: L('雨把小路洗亮了。我在屋檐下数水滴。', 'The rain polished the path. I am counting drops under the eaves.'),
    waypoints: [
      { x: 4, y: 6 },
      { x: 8, y: 6 },
      { x: 8, y: 9 },
      { x: 4, y: 8 },
    ],
    lines: {
      low: [
        pages([
          L('村口的风今天是甜的。', 'The wind at the village gate tastes sweet today.'),
          L('你要是种了萝卜，叶子可以插在瓶子里。', 'If you grow turnips, the tops last for days in a bottle.'),
        ]),
        pages([
          L('我在数路边的小花。你路过会把数打乱。', 'I was counting roadside flowers. You walked through the count.'),
          L('没关系，花又不会因此生气。', 'It is fine. Flowers do not get cross about it.'),
        ]),
      ],
      mid: [
        pages([
          L('萝卜给我的话，我把叶子编成一个小环。', 'Give me a turnip and I\'ll braid the leaves into a little ring.'),
          L('你的农场从坡上看，像一块整齐的绿布。', 'From the slope your farm looks like a neat green cloth.'),
        ]),
        pages([
          L('夏天我会去小径捡野莓，你也可以去。', 'In summer I pick berries on the path. You can too.'),
          L('别跑太快，莓子会跳开的。这是我编的。', 'Don\'t run. The berries might hop away. I made that up.'),
        ]),
      ],
      high: [
        pages([
          L('我把你算进每天要打招呼的人里了。', 'I added you to the list of people I greet every day.'),
          L('那张名单很短，所以你的名字很大。', 'The list is short, so your name is written large.'),
        ]),
        pages([
          L('南瓜太重，我的篮子会抱怨。萝卜刚刚好。', 'Pumpkins make my basket complain. Turnips are just right.'),
          L('明天如果你来，我在老地方。', 'If you come tomorrow, I\'ll be at the usual spot.'),
        ]),
      ],
    },
  },
  {
    id: 'lin',
    zh: '林哥',
    en: 'Lin',
    map: 'village',
    x: 25,
    y: 6,
    liked: 'corn',
    disliked: 'egg',
    look: 'lin',
    rain: L('雨天钉子容易滑。我今天只量木头。', 'Nails slip in the rain. Today I only measure wood.'),
    waypoints: [
      { x: 25, y: 6 },
      { x: 21, y: 6 },
      { x: 21, y: 9 },
      { x: 26, y: 9 },
    ],
    lines: {
      low: [
        pages([
          L('房子不急。一天钉一根钉子也好。', 'No rush on a house. One nail a day is a fine pace.'),
          L('你的篱笆如果松了，叫我，别自己跟它对扯。', 'If a fence loosens, call me. Don\'t wrestle it alone.'),
        ]),
        pages([
          L('玉米杆晒干了，能当篱笆的绑带。', 'Dried corn stalks make decent fence ties.'),
          L('我闻得出谁今天刨过地。是你。', 'I can smell who tilled today. It was you.'),
        ]),
      ],
      mid: [
        pages([
          L('蛋我不太收。手上一滑，一天的木头都要重新量。', 'I\'m clumsy with eggs. One slip and I remeasure the whole day\'s wood.'),
          L('玉米就很好，啃完还能把杆子留下。', 'Corn is better. You eat it and still keep the stalk.'),
        ]),
        pages([
          L('店里的洒水器是铁的，不是我打的，但装得不歪。', 'The sprinkler is iron, not my work, but it sits straight.'),
          L('你要是扩栏，我可以来看看尺寸。', 'If you widen a pen, I can come look at the measure.'),
        ]),
      ],
      high: [
        pages([
          L('你的农场门关得正好，不夹风。', 'Your farm gate closes true. It doesn\'t pinch the wind.'),
          L('这是我能给的很高的评价。', 'That is high praise, from me.'),
        ]),
        pages([
          L('下次你带玉米来，我把多余的杆子编给你。', 'Next time you bring corn, I\'ll braid you the spare stalks.'),
          L('朋友之间，钉子可以记账，也可以不记。', 'Between friends, nails can go on a tab, or not.'),
        ]),
      ],
    },
  },
  {
    id: 'wei',
    zh: '魏伯',
    en: 'Uncle Wei',
    map: 'village',
    x: 8,
    y: 13,
    liked: 'milk',
    disliked: 'tomato',
    look: 'wei',
    rain: L('下雨的牛奶要温得慢一点。', 'Rainy-day milk should be warmed slowly.'),
    waypoints: [
      { x: 8, y: 13 },
      { x: 10, y: 14 },
      { x: 9, y: 15 },
      { x: 7, y: 14 },
    ],
    lines: {
      low: [
        pages([
          L('牛奶温一温，晚上就听话。', 'Warm the milk, and the night behaves.'),
          L('我年轻时种过一整面坡。现在看着你们种就够了。', 'I once grew a whole slope. Watching you do it is enough now.'),
        ]),
        pages([
          L('告示板上的字是我写的，慢慢看。', 'I wrote the board. Read it slowly.'),
          L('番茄我胃不收。你自己留着吃吧。', 'My stomach declines tomatoes. Keep them for yourself.'),
        ]),
      ],
      mid: [
        pages([
          L('牛要是今天吃饱了，明天的奶会老实。', 'If the cow eats today, tomorrow\'s milk is honest.'),
          L('你走路的声音像一个知道自己要去哪的人。', 'Your steps sound like someone who knows where they are going.'),
        ]),
        pages([
          L('冬天别跟冻土较劲。去小径捡松果也算干活。', 'Don\'t argue with frozen ground. Pine cones on the path still count as work.'),
          L('我在这根柱子旁边，风小。', 'I stand by this post. The wind is smaller here.'),
        ]),
      ],
      high: [
        pages([
          L('你送来的奶，我晚上会想起来。', 'I think of your milk in the evening.'),
          L('青禾村的年轻人里，你是会回来睡觉的那种。', 'Of the young ones, you are the kind who comes home to sleep.'),
        ]),
        pages([
          L('好。今天也看见你了。这样就行。', 'Good. I saw you today. That is enough.'),
          L('明天也来的话，我还在。', 'If you come tomorrow, I will still be here.'),
        ]),
      ],
    },
  },
  {
    id: 'tao',
    zh: '桃奶奶',
    en: 'Granny Tao',
    map: 'village',
    x: 16,
    y: 14,
    liked: 'pumpkin',
    disliked: 'corn',
    look: 'tao',
    rain: L('听雨比听钟准。今天适合烤南瓜。', 'Rain keeps better time than a clock. A good day to roast pumpkin.'),
    waypoints: [
      { x: 16, y: 14 },
      { x: 14, y: 15 },
      { x: 16, y: 13 },
      { x: 15, y: 15 },
    ],
    lines: {
      low: [
        pages([
          L('南瓜烤一烤，屋子就香了。', 'Roast a pumpkin and the house smells kind.'),
          L('冬天就该坐下，听炉子说话。', 'Winter is for sitting down and listening to the stove.'),
        ]),
        pages([
          L('玉米容易卡牙。我更想要圆圆的南瓜。', 'Corn sticks in my teeth. I would rather have a round pumpkin.'),
          L('你脸上有土。这是夸奖。', 'There is dirt on your face. That is a compliment.'),
        ]),
      ],
      mid: [
        pages([
          L('把蛋和奶放在一起煮，是懒人的好汤。', 'Eggs and milk in one pot is a fine lazy soup.'),
          L('你的鸡叫得不算早，我喜欢这样。', 'Your hens are not too early. I like that.'),
        ]),
        pages([
          L('店里的花婶嘴硬，心软，跟烤箱一样。', 'Aunt Hua talks crisp and means soft, like an oven.'),
          L('你要是累了，可以先坐我这边的台阶。', 'If you are tired, the step on my side is free.'),
        ]),
      ],
      high: [
        pages([
          L('我给常来的人留一块南瓜饼的位置。', 'I save a spot of pumpkin cake for people who visit.'),
          L('你的位置在靠窗。那里不顶风。', 'Yours is by the window. The draft misses it.'),
        ]),
        pages([
          L('今天的村子因为你多了一点脚步。', 'The village has a few more footsteps because of you.'),
          L('去吧，别误了浇水。饼会等你。', 'Go on, don\'t miss watering. The cake will wait.'),
        ]),
      ],
    },
  },
];

export function npcDef(id) {
  return NPC_DEFS.find((n) => n.id === id) || null;
}
