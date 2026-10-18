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

  // 6 道菜＝6 個關卡，照宴會生命週期排序。teach＝練習前的白話教學段
  courses: [
    {
      no: 1, dish: "開胃菜", kind: "prompt", title: "提示詞積木",
      staff: "企劃員", icon: "clipboard-text", seconds: 240,
      badge: { name: "提示詞主廚", icon: "chef-hat", title: "提示詞主廚", rare: 7 },
      teach: [
        { type: "flip", mins: 2, title: "企劃先問 7 個問題",
          intro: "辦任何活動，腦袋裡都要先回答 7 個問題。一張一張點開看看。",
          cards: [
            { label: "Who", zh: "誰", icon: "users", analogy: "辦生日趴第一件事：要請誰？誰來幫忙？", example: "300 位通路商、採購、媒體，其中 20 位吃清真、15 位吃素、1 位坐輪椅" },
            { label: "What", zh: "做什麼", icon: "fork-knife", analogy: "煮飯前先決定：今天煮什麼菜？", example: "新品發表＋晚宴，主角是新品「冷萃烏龍燕麥奶」" },
            { label: "When", zh: "什麼時候", icon: "clock", analogy: "訂餐廳：幾點入座、用餐限時多久？", example: "18:30 入場、19:00 發表、20:00 開席、21:30 送客" },
            { label: "Where", zh: "在哪裡", icon: "map-pin", analogy: "找餐廳訂位，先問：坐得下嗎？", example: "飯店宴會廳，要坐得下 300 人、有舞台和投影" },
            { label: "Why", zh: "為什麼", icon: "target", analogy: "請朋友吃飯，是要慶祝，還是要拜託事情？", example: "讓通路商願意把新品放上貨架" },
            { label: "How", zh: "怎麼做", icon: "list-numbers", analogy: "照食譜一步一步做，誰先誰後", example: "報到 → 發表 → 上菜 → 送客，每一步誰負責" },
            { label: "How much", zh: "多少錢", icon: "coins", analogy: "出門玩之前，先看荷包剩多少", example: "總預算控制在 NT$150 萬內" }
          ],
          reveal: { title: "這 7 個問題，就叫 5W2H", text: "5 個 W（Who、What、When、Where、Why）加 2 個 H（How、How much）。企劃書先把這 7 格填滿，就不太會漏東西。等一下交代 AI 寫企劃，也要叫它照這 7 格寫。" } },
        { type: "match", mins: 1, title: "小測驗：這句屬於哪一格？",
          intro: "先點一句話，再點它屬於的那一格。",
          targets: [ { id: "who", label: "Who 誰" }, { id: "when", label: "When 什麼時候" }, { id: "where", label: "Where 在哪裡" },
                     { id: "why", label: "Why 為什麼" }, { id: "howmuch", label: "How much 多少錢" } ],
          items: [
            { text: "18:30 開放入場", ans: "when", why: "講時間，就是 When。" },
            { text: "宴會廳要坐得下 300 人", ans: "where", why: "講場地，就是 Where。" },
            { text: "總預算 150 萬內", ans: "howmuch", why: "講錢，就是 How much。" },
            { text: "讓通路商願意上架新品", ans: "why", why: "講目的，就是 Why。" },
            { text: "有 20 位賓客吃清真", ans: "who", why: "講「來的是誰、他們需要什麼」，屬於 Who。" }
          ] },
        { type: "toggle", mins: 1, title: "交代 AI 的 4 個開關",
          intro: "就像點飲料：品項、大小、甜度、冰塊講清楚，店員才不用一直反問你。交代 AI 也一樣，一顆一顆打開，看回答怎麼變好；再關掉一顆，看少了它會怎樣。", lead: "你對 AI 說：",
          parts: [
            { label: "角色", say: "你是五星飯店宴會企劃經理，", off: "✗ 語氣像學生作文，沒有專業用語", on: "✓ 用宴會企劃的專業語言和格式" },
            { label: "任務", say: "幫我寫 300 人新品發表餐會的企劃書，", off: "✗ 不知道要辦什麼，只給一般活動建議", on: "✓ 內容對準「300 人新品發表餐會」" },
            { label: "條件", say: "包含 5W2H，有 20 位清真、15 位素食賓客，預算 150 萬內，", off: "✗ 可能排出豬肉菜單、預算爆表", on: "✓ 照 5W2H 寫，菜單避開豬肉、預算算在 150 萬內" },
            { label: "格式", say: "用表格，附負責人和期限。", off: "✗ 丟給你一大段文字，還要自己整理", on: "✓ 一張表格，拿到就能分工" }
          ],
          done: "這 4 個開關，就是等一下要練習的「提示詞積木」：角色＋任務＋條件＋格式。" }
      ],
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
      badge: { name: "鷹眼審稿", icon: "eye", title: "鷹眼審稿組", rare: 2 },
      docTitle: "宴會企劃書（初稿）", docKicker: "AI OUTPUT · DRAFT",
      teach: [
        { type: "guess", mins: 1.5, title: "AI 寫的這段，有沒有問題？",
          doc: "「已為您預訂飯店 3F 宴會廳（最多容納 200 人），空間寬敞，非常適合 300 人的新品發表餐會。」",
          question: "這段 AI 寫的企劃，有沒有問題？", options: ["沒問題，寫得很專業", "有問題"], answer: 1,
          explain: "200 人的廳要塞 300 人，根本坐不下。AI 就像一個很有自信的新實習生：交得很快、講得很像真的，但它沒去過現場，數字兜不攏也不會發現。" },
        { type: "flip", mins: 1.5, title: "AI 最常唬爛的 4 個地方",
          intro: "記住這 4 個地方，審稿時先查它們。",
          cards: [
            { label: "數字", icon: "calculator", analogy: "心算很快的人，偶爾也會按錯計算機", example: "每位 4,500 元 × 300 人，AI 可能算成 13.5 萬（其實是 135 萬）" },
            { label: "日期", icon: "calendar-blank", analogy: "背了很多日期，但沒看日曆", example: "寫「2026 年 1 月 1 日星期一」，翻日曆才發現是星期四" },
            { label: "沒去過的現場", icon: "map-pin", analogy: "只看過照片、沒去過餐廳的人推薦你座位", example: "說宴會廳坐得下，其實只能坐 200 人" },
            { label: "忘記限制", icon: "warning", analogy: "記性不好的服務生，忘了你說過不吃辣", example: "明明有 20 位清真賓客，菜單還寫豬腳" }
          ],
          reveal: { title: "審稿口訣：AI 出稿、人來審", text: "數字自己再算一次、日期翻日曆、場地打電話問、限制逐條對。會用 AI 的人很多，會審 AI 的人才值錢。" } },
        { type: "match", mins: 1, title: "小測驗：這是哪一種唬爛？",
          intro: "先點一句 AI 寫的話，再點它錯在哪一種。",
          targets: [ { id: "num", label: "數字" }, { id: "date", label: "日期" }, { id: "site", label: "沒去過的現場" }, { id: "limit", label: "忘記限制" } ],
          items: [
            { text: "「服務生 15 位，每人顧 2 桌，共 20 桌」", ans: "num", why: "15 × 2 ＝ 30 桌，數字算錯。" },
            { text: "「12 月 25 日（星期日）聖誕晚宴」", ans: "date", why: "2026 年 12 月 25 日是星期五，要翻日曆。" },
            { text: "「15 位素食賓客，主菜一律牛排」", ans: "limit", why: "忘了素食這個限制。" },
            { text: "「宴會廳挑高 10 米，可以放熱氣球」", ans: "site", why: "沒去過現場亂寫，要打電話跟場地確認。" }
          ] }
      ],
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
      no: 3, dish: "魚料理", kind: "cost", title: "隱藏成本大挑戰",
      staff: "會計員", icon: "calculator", seconds: 240, cap: 1500000,
      badge: { name: "成本鷹眼", icon: "coins", title: "成本鷹眼組", rare: 4 },
      teach: [
        { type: "guess", mins: 1.5, title: "先猜：這頓吃到飽最後要付多少？",
          question: "網路上寫「吃到飽 NT$599／人」，週末 4 個人去慶生、自己帶蛋糕，結帳時大概要付多少？",
          options: ["NT$2,396", "大約 NT$2,700", "大約 NT$3,600"], answer: 2,
          checkout: [
            { label: "餐費 599 × 4 人", amount: 2396 }, { label: "週末每人加價 100", amount: 400 },
            { label: "飲料另計 4 杯", amount: 320 }, { label: "自帶蛋糕切蛋糕費", amount: 300 }, { label: "10% 服務費（餐費的一成）", amount: 240 }
          ],
          explain: "最後要付 NT$3,656，比標價多了一半以上。這些一開始沒寫出來、結帳才跳出來的錢，就叫「隱藏成本」。" },
        { type: "flip", mins: 1.5, title: "宴會最常漏掉的 4 種錢",
          intro: "一張一張點開，看生活裡哪裡也有這種錢。",
          cards: [
            { label: "服務費", icon: "receipt", analogy: "餐廳帳單最後多一行「加收 10%」", example: "飯店餐飲常另加一成服務費，300 人餐費 96 萬，光服務費就 9.6 萬" },
            { label: "加班費", icon: "clock", analogy: "半夜叫宵夜外送，多收一筆夜間費", example: "散場後撤場拖過合約時間，就要付工作人員加班費" },
            { label: "損耗備品", icon: "package", analogy: "煮飯會多煮一點，怕客人不夠吃", example: "多備 5% 餐點，以防臨時多來的客人或出餐失誤" },
            { label: "合約小字", icon: "file-text", analogy: "吃到飽菜單最下面的小字：剩食要罰錢", example: "場地清潔費、保險，常寫在合約最後一頁" }
          ],
          reveal: { title: "AI 估價只看「標價」", text: "AI 不知道你們場地另外收什麼。用 AI 估預算，一定要追問一句：「還有哪些常被漏掉的費用？」然後拿合約一項一項對。" } },
        { type: "match", mins: 1, title: "小測驗：要另外算，還是已經包含？",
          intro: "看合約怎麼寫，再判斷。先點一項，再點答案。",
          targets: [ { id: "extra", label: "要另外算" }, { id: "incl", label: "已經包含" } ],
          items: [
            { text: "賓客自己帶酒的「開瓶費」", ans: "extra", why: "很多餐廳每瓶另收開瓶費，合約沒寫清楚就會被追加。" },
            { text: "合約寫「含音響與一支無線麥克風」的麥克風", ans: "incl", why: "合約寫明含了，不用另外算。" },
            { text: "賓客停車超過免費 3 小時的停車費", ans: "extra", why: "超過免費時數要另外付，要先問清楚誰買單。" },
            { text: "合約寫「含貴賓休息室」的休息室", ans: "incl", why: "合約寫明含了，再算一次就重複了。" }
          ] }
      ],
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
      no: 4, dish: "主菜", kind: "spot", docStyle: "invite", title: "邀請函找碴",
      staff: "設計員", icon: "envelope-simple", seconds: 180, markLimit: 7,
      badge: { name: "禮儀把關", icon: "envelope-simple", title: "禮儀把關組", rare: 3 },
      docTitle: "邀請函（AI 初稿）", docKicker: "AI OUTPUT · INVITATION",
      teach: [
        { type: "flip", mins: 1.5, title: "AI 員工升級了：會看、也會畫",
          intro: "以前的 AI 只會打字。現在同一個員工有好幾種本事，這就叫「多模態」。",
          cards: [
            { label: "會寫字", icon: "pencil-simple", analogy: "像文書秘書", example: "幫你寫中英雙語的邀請函文字" },
            { label: "會看圖", icon: "eye", analogy: "拿照片給設計師看：「我要這種感覺」", example: "上傳一張你喜歡的邀請函，請它照這個風格" },
            { label: "會畫圖", icon: "paint-brush", analogy: "像美編", example: "打一段描述，它畫出邀請函的背景圖" },
            { label: "會聽會說", icon: "microphone", analogy: "像電話秘書", example: "用講的交代它，它也能唸給你聽" }
          ],
          reveal: { title: "多模態＝一個員工能讀、能看、能畫", text: "但有個坑：AI 畫圖時，畫面上的中文字常常畫錯、變成亂碼。所以邀請函的圖請 AI 畫，字自己放上去。" } },
        { type: "flip", mins: 1.5, title: "一張好邀請函的 5 個零件",
          intro: "每個零件點開，看看少了它會怎樣。",
          cards: [
            { label: "時間地點", icon: "map-pin", analogy: "約朋友卻沒講在哪見面", example: "少了它：賓客跑錯飯店，電話打到你手機爆掉" },
            { label: "回覆期限", icon: "calendar-check", analogy: "揪團吃飯卻不問誰要來", example: "少了它：廚房不知道要備幾份，太多浪費、太少不夠吃" },
            { label: "稱謂", icon: "user", analogy: "叫錯朋友的名字", example: "寫錯了：把女士寫成先生，客戶當場尷尬" },
            { label: "中英一致", icon: "translate", analogy: "同一家店兩張菜單價錢不一樣", example: "寫錯了：英文寫早上 6:30，外賓一大早就到了" },
            { label: "飲食說明", icon: "leaf", analogy: "請吃素的朋友去燒肉店", example: "少了它：清真賓客看到豬肉主菜，直接不來" }
          ],
          reveal: { title: "5 個零件，一個都不能少", text: "等一下要審的邀請函是 AI 寫的，裡面藏了 5 個錯。照這 5 個零件一個一個檢查。" } },
        { type: "match", mins: 1, title: "小測驗：這張邀請函出了什麼問題？",
          intro: "這是別場活動的邀請函片段。先點一段，再點它出問題的零件。",
          targets: [ { id: "rsvp", label: "回覆期限" }, { id: "title", label: "稱謂" }, { id: "bi", label: "中英一致" }, { id: "diet", label: "飲食說明" } ],
          items: [
            { text: "「12 月 3 日尾牙，敬請光臨。」整張都沒寫要不要回覆", ans: "rsvp", why: "沒寫回覆期限，廚房不知道要備幾桌。" },
            { text: "寫給陳美玲經理的英文：Dear Mr. Chen", ans: "title", why: "女士寫成 Mr.，稱謂和性別要查清楚。" },
            { text: "中文寫 12 月 3 日，英文寫 December 13", ans: "bi", why: "中英日期不一樣，外賓會跑錯天。" },
            { text: "主打「燒烤豬肋排吃到飽」，賓客名單裡有素食和清真", ans: "diet", why: "邀請函要讓特殊飲食的賓客知道有他們能吃的。" }
          ] }
      ],
      mission: "我是 AI 設計員。中英雙語邀請函我寫好了，可是我對禮儀和日曆不太熟，可能有 5 個地方寫錯。你們只有 7 次標記機會，幫我抓出來。",
      lines: [
        { text: "敬邀 Siti Rahman 女士｜Dear Mr. Siti Rahman", wrong: true,
          why: "Siti 是女性，英文卻寫成 Mr.（先生）。中英稱謂要一致，應寫 Dear Ms. Siti。馬來名字沒有「姓氏」，稱呼 Ms. Siti 才對。" },
        { text: "禾穗食品 2026 新品發表餐會｜HE-SUI Foods 2026 New Product Launch Banquet", wrong: false, why: "主旨中英一致，正確。" },
        { text: "日期：2026 年 11 月 20 日（星期三）｜Date: Wednesday, 20 November 2026", wrong: true,
          why: "翻日曆，2026 年 11 月 20 日是星期五，中英文都寫成星期三。AI 很會背日期，但不會看日曆。" },
        { text: "時間：18:30 入場、19:00 發表｜Time: Reception 6:30 AM, Launch 7:00 PM", wrong: true,
          why: "中文寫晚上 18:30，英文寫成早上 6:30 AM。外賓看英文，一大早就到了。應寫 6:30 PM。" },
        { text: "地點：禾豐國際酒店 3F 宴會廳｜Venue: Grand Ballroom, 3F, Hefeng International Hotel", wrong: false, why: "地點中英一致，正確。" },
        { text: "服裝：商務正式｜Dress code: Business formal", wrong: false, why: "中英一致，正確。" },
        { text: "菜單亮點：主廚特製伊比利豬佐冷萃烏龍醬｜Highlight: Chef's Iberico pork with oolong sauce", wrong: true,
          why: "有 20 位清真賓客，邀請函卻主打豬肉，他們會覺得被忽略，甚至不來。亮點要選大家都能吃的，或註明另備清真餐。" },
        { text: "敬請於活動當天回覆出席｜Kindly RSVP on the day of the event", wrong: true,
          why: "活動當天才回覆，廚房根本來不及備料。回覆期限通常訂在活動前兩週，例如 11 月 6 日前。" },
        { text: "停車：飯店地下停車場，憑邀請函免費 3 小時｜Parking: Free for 3 hours with this invitation", wrong: false, why: "有考慮交通，中英一致，正確。" },
        { text: "聯絡人：公關部 陳小姐 02-2345-6789｜Contact: Ms. Chen, PR Dept.", wrong: false, why: "有聯絡人和電話，正確。" }
      ],
      lesson: "邀請函是賓客對這場宴會的第一印象。AI 寫得又快又漂亮，但稱謂、日期、中英對照、回覆期限、飲食限制，每一項都要人來核對。",
      takehome: "你是宴會禮賓專員。請幫我檢查這張中英雙語邀請函：〔貼上邀請函〕。逐項確認：稱謂與性別、日期和星期是否一致、中英文時間是否一致、回覆期限是否合理、菜單有沒有違反賓客的宗教或飲食限制。用表格列出問題與修改建議。",
      imageBuilder: {
        title: "換你生一張：用自己的 AI 畫邀請函背景",
        groups: [
          { key: "style", label: "風格", options: ["典雅金色、像五星飯店", "清新植物、有烏龍茶葉和燕麥", "現代極簡、留很多白"] },
          { key: "color", label: "主色", options: ["深藍配金色", "奶油白配抹茶綠", "黑白配一個亮橘色"] },
          { key: "photo", label: "新品照片", options: ["畫面中間留一塊位置放新品照片", "不放照片，只畫背景圖案"] }
        ],
        template: "請幫我畫一張宴會邀請函的背景圖。主題是「禾穗食品 2026 新品發表餐會」，新品是冷萃烏龍燕麥奶。風格：{style}；配色：{color}；{photo}。直式比例，上方留空白放標題，下方留空白放時間地點。畫面上不要出現任何文字（中文字我會自己加上去）。"
      }
    },
    {
      no: 5, dish: "甜點", kind: "seat", title: "特殊餐飲排座",
      staff: "賓客專員", icon: "chair", seconds: 240,
      badge: { name: "零客訴桌", icon: "armchair", title: "零客訴桌", rare: 5 },
      teach: [
        { type: "match", mins: 1.5, title: "家族聚餐，幫大家排座",
          intro: "過年吃飯，每個人都有一點要求。先點人，再點桌。",
          targets: [ { id: "wc", label: "靠廁所的 1 號桌" }, { id: "veg", label: "素食的 2 號桌" }, { id: "door", label: "靠門口的 3 號桌" } ],
          items: [
            { text: "阿嬤（膝蓋不好，常跑廁所）", ans: "wc", why: "靠近廁所，阿嬤走最少路。" },
            { text: "舅舅（吃全素）", ans: "veg", why: "素菜都在 2 號桌，不會吃到葷的。" },
            { text: "姑丈（坐輪椅）", ans: "door", why: "靠門口，輪椅進出最方便。" }
          ] },
        { type: "guess", mins: 1, title: "這些「誰要坐哪」叫什麼？",
          question: "阿嬤要靠廁所、舅舅吃素、姑丈坐輪椅，這些要求在排座時叫做什麼？",
          options: ["個人喜好，可以不理", "限制條件，一定要滿足", "隨機分配就好"], answer: 1,
          explain: "這些必須滿足的規則就叫「限制條件」。3 個人你排得出來；300 個人、幾十條限制，就是 AI 最拿手的排列組合。" },
        { type: "guess", quiz: true, mins: 1, title: "兩個要求打架時怎麼辦？",
          question: "有位主講人吃全素，可是主桌是一般菜單。怎麼排？",
          options: ["排到蔬食桌，致詞時再走上台", "坐主桌，蔬食套餐從蔬食廚房另外送過去"], answer: 1,
          explain: "座位跟著「身分與動線」走（主講人要坐主桌、方便上台），餐點跟著「飲食限制」走（另外送）。兩個需求打架時，AI 會排，但要人來決定哪個優先。" }
      ],
      mission: "我是 AI 賓客專員。10 位賓客要排座，有人吃清真、有人吃素、有人坐輪椅。先點賓客，再點桌子。",
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
      no: 6, dish: "餐後茶", kind: "sort", title: "客訴分類閃電戰",
      staff: "客服分析員", icon: "chat-circle-dots", seconds: 120,
      badge: { name: "閃電客服", icon: "lightning", title: "閃電客服組", rare: 6 },
      teach: [
        { type: "match", mins: 1, title: "先分類，就像倒垃圾",
          intro: "每樣東西丟進對的桶。先點東西，再點桶子。",
          targets: [ { id: "paper", label: "紙類" }, { id: "plastic", label: "塑膠" }, { id: "metal", label: "鐵鋁罐" }, { id: "hazard", label: "廢電池（另外回收）" } ],
          items: [
            { text: "舊報紙", ans: "paper", why: "紙類。" },
            { text: "寶特瓶", ans: "plastic", why: "塑膠類。" },
            { text: "鋁罐", ans: "metal", why: "鐵鋁罐。" },
            { text: "用完的電池", ans: "hazard", why: "電池很少，但有毒，要另外回收。" }
          ] },
        { type: "guess", mins: 1, title: "哪一桶要先處理？",
          question: "分完之後：紙類 8 袋、塑膠 5 袋、電池 1 顆。哪個最該先處理？",
          options: ["紙類，因為最多", "電池，因為有危險"], answer: 1,
          explain: "件數多的，告訴你問題集中在哪；但危險的，再少也要先處理。客訴也一樣：食物中毒、過敏，1 件就要先處理。" },
        { type: "match", mins: 1.5, title: "小測驗：這則客訴丟哪一桶？",
          intro: "跟等一下的練習一樣，分成 4 類。",
          targets: [ { id: "food", label: "餐點品質" }, { id: "service", label: "服務流程" }, { id: "venue", label: "場地設備" }, { id: "special", label: "特殊需求" } ],
          items: [
            { text: "「湯上來的時候是冷的」", ans: "food", why: "餐點本身的問題。" },
            { text: "「等了 40 分鐘才上主菜」", ans: "service", why: "上菜流程的問題。" },
            { text: "「麥克風一直爆音」", ans: "venue", why: "設備的問題。" },
            { text: "「我說過對蝦過敏，還是上了蝦」", ans: "special", why: "特殊需求，而且是過敏，嚴重度最高，要最先處理。" }
          ] }
      ],
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
  ],

  // ── 數位生產線（現場示範，不計分）：8 桌各扮一家供應商。{d}＝延遲分鐘數 ──
  supply: {
    suppliers: [
      { team: 1, name: "海鮮行", item: "生蠔冷盤",
        late: "外場注意：生蠔延遲 {d} 分鐘，冷盤區先上沙拉，生蠔到了再補", out: "廚房注意：生蠔缺貨，冷盤改上煙燻鮭魚，外場請更新桌卡說明" },
      { team: 2, name: "清真餐點", item: "20 份清真主餐",
        late: "外場注意：清真主餐延遲 {d} 分鐘，先向清真桌賓客說明，加送麵包和湯", out: "緊急：清真主餐缺貨，向其他清真認證餐廳緊急調餐，外場先向清真桌致歉，先上清真認證的冷盤或水果" },
      { team: 3, name: "花藝", item: "主桌與舞台花藝",
        late: "佈場注意：花藝延遲 {d} 分鐘，先佈桌巾和餐具，花最後補上", out: "佈場注意：花藝缺貨，主桌改用蠟燭與綠葉裝飾" },
      { team: 4, name: "音響燈光", item: "舞台音響與燈光",
        late: "活動組注意：音響延遲 {d} 分鐘，彩排往後延，主持人先用備用麥克風", out: "緊急：音響缺貨，改用飯店備用音響，發表前一定要試音" },
      { team: 5, name: "甜點", item: "300 份甜點",
        late: "廚房注意：甜點延遲 {d} 分鐘，上菜節奏放慢，先上水果盤", out: "廚房注意：甜點缺貨，改由飯店廚房出季節水果塔" },
      { team: 6, name: "酒水", item: "迎賓酒與飲料",
        late: "外場注意：酒水延遲 {d} 分鐘，迎賓先用新品冷萃烏龍燕麥奶招待", out: "外場注意：酒水缺貨，改向飯店酒吧調貨，請先確認數量" },
      { team: 7, name: "印刷", item: "菜單與桌卡",
        late: "外場注意：桌卡延遲 {d} 分鐘，入場時先由服務生帶位", out: "外場注意：桌卡缺貨，改用投影幕顯示座位表，服務生帶位" },
      { team: 8, name: "口譯", item: "中英口譯人員",
        late: "活動組注意：口譯延遲 {d} 分鐘，致詞順序調整，先播新品影片", out: "緊急：口譯沒到，改由公關部英文好的同事上台，講稿先給他" }
    ]
  }
};
