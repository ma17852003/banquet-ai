// 《宴會指揮官：AI 超級團隊》題目與設定（全部食品業情境）
// 改題目、改秒數、改組名只改這個檔，不用動畫面程式。
window.GAME = {
  api: "https://n8n.infernoedge247365.dpdns.org/webhook",

  scenario: {
    title: "300 人國際食品品牌新品發表餐會",
    guests: "國內外通路商、採購、媒體、美食部落客共 300 人，其中 20 位清真飲食、15 位素食、1 位輪椅賓客"
  },

  // 8 組＝8 張桌。顏色一律搭配形狀＋桌號，不單靠顏色辨識（色弱也分得出來）
  teams: [
    { no: 1, name: "抹茶", color: "#8DB86B", shape: "circle" },
    { no: 2, name: "海鹽", color: "#5AA9D6", shape: "square" },
    { no: 3, name: "芋頭", color: "#A58BD0", shape: "triangle" },
    { no: 4, name: "蜜桃", color: "#E58FB0", shape: "diamond" },
    { no: 5, name: "薄荷", color: "#4CC3B5", shape: "hexagon" },
    { no: 6, name: "焦糖", color: "#C98A5B", shape: "star" },
    { no: 7, name: "石墨", color: "#9AA3B5", shape: "cross" },
    { no: 8, name: "杏仁", color: "#E9DFC9", shape: "ring" }
  ],

  // 5 道菜＝5 個關卡。soon:true 的道次先顯示「下次開放」
  courses: [
    {
      no: 1, dish: "開胃菜", kind: "prompt", title: "提示詞積木",
      staff: "企劃員", icon: "clipboard-text", seconds: 240,
      mission: "我是 AI 企劃員。你們交代得越清楚，我寫得越好。用四塊積木，組一句提示詞給我。",
      slots: [
        { key: "role", label: "角色", en: "ROLE", options: [
          { text: "你是有 10 年經驗的五星飯店宴會企劃經理，", pts: 25, why: "角色越具體，AI 的回答越專業。" },
          { text: "你是一位宴會企劃，", pts: 10, why: "有角色，但沒講經驗和場合，回答會比較普通。" },
          { text: "（不設定角色）", pts: 0, why: "沒有角色，AI 只會給你一般大眾的答案。" }
        ]},
        { key: "task", label: "任務", en: "TASK", options: [
          { text: "幫我做一份 300 人國際食品品牌新品發表餐會的宴會企劃書初稿，", pts: 25, why: "人數、場合、要交什麼都講清楚了。" },
          { text: "幫我規劃一場餐會，", pts: 10, why: "沒講人數和性質，AI 只能用猜的。" },
          { text: "幫我辦活動，", pts: 0, why: "太模糊，連要辦什麼都不知道。" }
        ]},
        { key: "cond", label: "條件", en: "RULES", options: [
          { text: "要包含 5W2H，賓客有 20 位清真飲食者、15 位素食者，總預算控制在 NT$150 萬內，", pts: 25, why: "飲食限制和預算先講，AI 才不會排出不能吃、超預算的企劃。" },
          { text: "要包含 5W2H，", pts: 10, why: "有架構，但漏了飲食限制和預算，偏偏最容易出事的就是這兩個。" },
          { text: "越詳細越好，", pts: 0, why: "「越詳細越好」不是條件，AI 只會寫一大篇廢話給你。" }
        ]},
        { key: "fmt", label: "格式", en: "FORMAT", options: [
          { text: "用表格呈現，每一項附上負責人與完成期限。", pts: 25, why: "拿到就能直接分工，不用自己再整理。" },
          { text: "用表格呈現。", pts: 10, why: "有表格很好，加上負責人和期限就能直接用。" },
          { text: "（不指定格式）", pts: 0, why: "不指定格式，AI 常丟一大段文字給你，很難用。" }
        ]}
      ],
      lesson: "好提示詞＝角色＋任務＋條件＋格式。條件裡一定要寫「飲食限制」和「預算」，餐飲業最常出事的就是這兩件。"
    },
    {
      no: 2, dish: "湯品", kind: "spot", title: "AI 企劃找碴",
      staff: "專案助理", icon: "magnifying-glass", seconds: 180, markLimit: 7,
      mission: "我是 AI 專案助理。這份企劃是我寫的，可能有 5 個地方寫錯了。你們只有 7 次標記機會，幫我抓出來。",
      lines: [
        { text: "【場地】飯店 3F 宴會廳，圓桌最多容納 200 人，本次賓客 300 人。", wrong: true,
          why: "場地只坐得下 200 人，賓客卻有 300 人。AI 常把數字兜不攏，場地容量一定要跟人數對一次。" },
        { text: "【流程】18:30 賓客入場，19:00 新品發表，20:00 晚宴開始，21:30 結束。", wrong: false,
          why: "時間安排合理。" },
        { text: "【佈場】當天 18:00 開始佈置舞台與 30 桌圓桌。", wrong: true,
          why: "18:30 就開放入場，只剩 30 分鐘要佈 30 桌加舞台，來不及。佈場通常排前一晚或當天下午。" },
        { text: "【菜單】主菜：德國豬腳，全場統一出餐。", wrong: true,
          why: "有 20 位清真飲食賓客，不能全場統一上豬肉，要另外準備清真認證的餐點。" },
        { text: "【素食】15 位素食賓客另備蔬食套餐，與葷食分開製備。", wrong: false,
          why: "分開製備，避免交叉污染，正確。" },
        { text: "【冷盤】生蠔冷盤 17:00 擺上自助區，室溫放到 21:30。", wrong: true,
          why: "生食海鮮在室溫放 4 個半小時，是嚴重的食安問題。生蠔要全程冰鎮，短時間內出完。" },
        { text: "【預算】每位 NT$4,500 × 300 人 = NT$135,000。", wrong: true,
          why: "算錯了，正確是 NT$1,350,000，少一個 0。AI 算數會錯，金額一定要自己再算一次。" },
        { text: "【人力】外場服務生 1 人負責 2 桌，30 桌共 15 位。", wrong: false,
          why: "30 ÷ 2 = 15，算得對。" },
        { text: "【邀請函】中英雙語，提前 3 週寄出，附回覆期限。", wrong: false,
          why: "國際賓客用雙語、提早寄出，正確。" },
        { text: "【備案】下雨時，賓客由地下停車場電梯直達宴會廳。", wrong: false,
          why: "有想到天候動線，合理。" }
      ],
      lesson: "AI 寫的東西看起來很專業，但數字、食品安全、宗教飲食最容易出錯。AI 出稿，人來審。",
      takehome: "你是資深宴會審稿主管。請逐條檢查以下宴會企劃，特別注意：場地容量與人數是否相符、時間來不來得及、菜單有沒有違反賓客的宗教或飲食限制、食品安全（溫度與放置時間）、金額計算。用表格列出每個問題、為什麼有問題、建議怎麼改。\n〔貼上你的企劃〕"
    },
    {
      no: 3, dish: "主菜", kind: "cost", title: "隱藏成本大挑戰",
      staff: "會計員", icon: "calculator", seconds: 240, cap: 1500000,
      mission: "我是 AI 會計員。我算出來的預算是 NT$134 萬，在 150 萬上限內。可是我常漏東西，幫我把漏掉的成本加回去。",
      budget: [
        { item: "餐點（每位 NT$3,200 × 300 人，含餐具桌巾）", amount: 960000 },
        { item: "場地租金（宴會廳 14:00–22:00，含水電空調）", amount: 180000 },
        { item: "舞台與花藝布置",               amount: 120000 },
        { item: "音響燈光",                     amount: 80000 }
      ],
      cards: [
        { name: "服務費 10%（飯店餐飲加收）", amount: 96000, hidden: true,
          why: "飯店宴會的餐飲費常另加一成服務費，AI 常直接拿菜單價來算。" },
        { name: "清真餐點製備差額（20 位）", amount: 30000, hidden: true,
          why: "清真餐要由認證廚房另外製作，單價比一般餐高。前面幾道提過的賓客需求，預算也要跟著算。" },
        { name: "場地清潔與垃圾清運", amount: 15000, hidden: true,
          why: "很多場地的清潔費要另外付，寫在合約小字裡。" },
        { name: "撤場超時加班費", amount: 24000, hidden: true,
          why: "21:30 散場後拆台撤場常拖到 23:00，超過場地和人員約定的 22:00，就要付加班費。" },
        { name: "客戶試菜（10 人份）", amount: 20000, hidden: true,
          why: "正式宴會前通常會安排試菜，食材和人力都是成本。" },
        { name: "餐點損耗與備品（多備 5%）", amount: 48000, hidden: true,
          why: "臨時多來的賓客、出餐失誤，都要靠多備的份量撐住。" },
        { name: "中英口譯人員", amount: 36000, hidden: true,
          why: "國際賓客多，致詞和新品介紹要有口譯。" },
        { name: "公共意外責任險", amount: 8000, hidden: true,
          why: "300 人的活動，場地通常會要求主辦方投保。" },
        { name: "場地租金", amount: 180000, hidden: false,
          why: "陷阱：預算單上已經算過了，再加一次就是重複計算。" },
        { name: "舞台與花藝布置", amount: 120000, hidden: false,
          why: "陷阱：預算單上已經算過了。" },
        { name: "宴會廳冷氣電費", amount: 12000, hidden: false,
          why: "陷阱：預算單上寫了，場租已經含水電空調。" },
        { name: "餐具與桌巾租借", amount: 25000, hidden: false,
          why: "陷阱：預算單上寫了，餐點費已經含餐具桌巾。" }
      ],
      lesson: "AI 很會列項目，但它不知道你們場地另外收清潔費、服務費。用 AI 估預算，一定要追問一句：「還有哪些常被漏掉的費用？」",
      takehome: "你是台灣的宴會會計。以下是我的宴會預算：〔貼上預算〕。請列出 10 項台灣宴會最常被漏算的隱藏成本（例如服務費、清潔費、撤場加班、保險、試菜、損耗備品），逐項估算金額，最後告訴我總預算會超出多少。用表格呈現。"
    },
    {
      no: 4, dish: "甜點", kind: "seat", title: "特殊餐飲排座",
      staff: "設計員", icon: "chair", seconds: 240,
      mission: "我是 AI 設計員。10 位賓客要排座，有人吃清真、有人吃素、有人坐輪椅。先點賓客，再點桌子。",
      tables: [
        { id: "vip",   name: "主桌",     note: "舞台正前方，貴賓與講者", icon: "crown-simple" },
        { id: "halal", name: "清真桌",   note: "清真認證廚房供餐",       icon: "moon-stars" },
        { id: "veg",   name: "蔬食桌",   note: "蔬食套餐，分開製備",     icon: "leaf" },
        { id: "acc",   name: "無障礙桌", note: "靠近出口與無障礙通道",   icon: "wheelchair" },
        { id: "gen",   name: "一般桌",   note: "一般菜單",               icon: "users" }
      ],
      tagInfo: {
        speaker: { label: "主講人",   icon: "microphone-stage" },
        vip:     { label: "主賓",     icon: "star" },
        halal:   { label: "清真飲食", icon: "moon-stars" },
        vegan:   { label: "全素",     icon: "leaf" },
        lacto:   { label: "蛋奶素",   icon: "leaf" },
        wheel:   { label: "使用輪椅", icon: "wheelchair" },
        none:    { label: "無特殊需求", icon: "user" }
      },
      guests: [
        { name: "品牌總經理",       tags: ["speaker"],        ans: "vip",   why: "要上台致詞的主講人，坐主桌上下台最方便。" },
        { name: "日本通路代表 佐藤", tags: ["vip"],            ans: "vip",   why: "最重要的外賓，安排主桌表示尊重。" },
        { name: "中東經銷商 Ahmed",  tags: ["halal"],          ans: "halal", why: "清真飲食要由清真認證廚房供餐。" },
        { name: "馬來西亞採購 Siti", tags: ["halal"],          ans: "halal", why: "清真飲食要由清真認證廚房供餐。" },
        { name: "美食部落客 小芸",   tags: ["vegan"],          ans: "veg",   why: "全素賓客坐蔬食桌，避免交叉污染。" },
        { name: "營養師 陳老師",     tags: ["lacto"],          ans: "veg",   why: "蛋奶素也是素食，坐蔬食桌。" },
        { name: "通路商 王董",       tags: ["wheel"],          ans: "acc",   why: "輪椅賓客要靠近出口和無障礙通道。" },
        { name: "杜拜代表 Omar",     tags: ["halal", "wheel"], ans: "acc",
          why: "兩個需求同時出現時，行動安全優先：坐無障礙桌，清真餐另外送到桌上。這種取捨要人來判斷。" },
        { name: "媒體記者 林小姐",   tags: ["none"],           ans: "gen",   why: "沒有特殊需求，安排一般桌。" },
        { name: "超市採購 張經理",   tags: ["none"],           ans: "gen",   why: "沒有特殊需求，安排一般桌。" }
      ],
      lesson: "限制條件多的排座，正是 AI 的強項。把名單和需求貼給 AI 分桌，再由你檢查有沒有互相衝突的需求（像 Omar 這種）。",
      takehome: "你是宴會專案助理。以下是賓客名單與飲食、行動需求：〔貼上名單〕。我們有主桌、清真桌、蔬食桌、無障礙桌、一般桌。請幫我分桌，用表格列出每位賓客的桌別與理由，並標出需求互相衝突、需要人工決定的賓客。"
    },
    {
      no: 5, dish: "餐後茶", kind: "sort", title: "客訴分類閃電戰",
      staff: "客服分析員", icon: "chat-circle-dots", seconds: 120,
      mission: "我是 AI 客服分析員。餐會結束，收到一堆賓客抱怨。限時 2 分鐘，把每則丟進對的分類，連續答對有加分。",
      cats: [
        { id: "food",    label: "餐點品質", hint: "好不好吃、熟不熟、新不新鮮", icon: "fork-knife" },
        { id: "service", label: "服務流程", hint: "上菜速度、報到流程、服務態度",   icon: "users-three" },
        { id: "venue",   label: "場地設備", hint: "冷氣、音響、廁所、照明",     icon: "buildings" },
        { id: "special", label: "特殊需求", hint: "素食、清真、過敏、無障礙",   icon: "heart" }
      ],
      items: [
        { text: "我們這桌的牛排上來是冷的，切開裡面還是生的。", cat: "food" },
        { text: "生蠔吃起來有怪味，我先生吃完一直跑廁所。", cat: "food" },
        { text: "我們這桌的主菜比別桌晚了 20 分鐘才上。", cat: "service" },
        { text: "報到處只有一個人在處理，排了快半小時才入場。", cat: "service" },
        { text: "服務生把紅酒倒在我的外套上，連一句道歉都沒有。", cat: "service" },
        { text: "冷氣開太強，好多女生都在發抖。", cat: "venue" },
        { text: "坐後面完全聽不到台上在講什麼，麥克風一直爆音。", cat: "venue" },
        { text: "廁所只有兩間，中場休息排隊排到走廊外面。", cat: "venue" },
        { text: "我登記了素食，結果送來的湯裡有肉片。", cat: "special" },
        { text: "我們的清真餐跟豬肉料理用同一台推車送出來。", cat: "special" },
        { text: "我對堅果過敏有先講，甜點上面還是撒了杏仁片。", cat: "special" },
        { text: "輪椅推不進我們那桌，只好擠在走道旁邊吃。", cat: "special" }
      ],
      lesson: "一堆雜亂的抱怨，分類、統計之後就知道問題集中在哪。這件事 AI 幾秒就能做完。但排優先順序不能只看件數，也要看嚴重度：食安和過敏永遠優先，這一步要你來判斷。",
      takehome: "你是宴會客服分析員。以下是活動後收到的賓客回饋：〔貼上回饋〕。請把每一則分成「餐點品質／服務流程／場地設備／特殊需求」，統計各類件數，找出最該優先改善的前 3 項，並給具體改善做法。用表格呈現。"
    }
  ]
};
