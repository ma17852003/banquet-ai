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
    { no: 3, dish: "主菜", kind: "soon", title: "隱藏成本大挑戰", staff: "會計員", icon: "calculator" },
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
    { no: 5, dish: "餐後茶", kind: "soon", title: "客訴分類閃電戰", staff: "客服分析員", icon: "chat-circle-dots" }
  ]
};
