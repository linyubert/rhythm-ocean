# Rhythm Voyage｜節奏航海學院

一款為音樂課堂設計的互動節奏遊戲。老師可以自行組合節奏題目，讓學生透過全班演奏完成航海任務、收集寶藏，並在動態 3D 海洋場景中前往下一個關卡。

## 專案特色

- 自訂四分音符、八分音符、休止符與小節線
- 提供預設節奏、隨機出題與快速體驗航線
- 3D 動態海浪、皇家帆船、寶島、沉船與寶藏動畫
- 航行時自動隱藏題目框，完整呈現動畫
- 隨機出現海怪、海盜船、衝浪者、鯊魚與鯨魚
- 每關隨機切換晴朗、夕陽、多雲與暴風雨
- 寶藏、連擊、完成率、音效與彩帶回饋
- 自動將關卡儲存在瀏覽器的 `localStorage`
- 支援桌機、教室大螢幕與手機版面
- 不需後端、不需登入，可直接以靜態網站部署

## 專案結構

```text
rhythm-ocean/
├── index.html
├── README.md
└── assets/
    ├── voyage-3d.js
    └── rhythm-voyage-hero.png
```

### 主要檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 首頁、關卡編輯器、遊戲介面、音效與遊戲流程 |
| `assets/voyage-3d.js` | Three.js 海洋、帆船、天氣及隨機事件動畫 |
| `assets/rhythm-voyage-hero.png` | 首頁與完成畫面的品牌主視覺 |


## 操作方式

1. 在首頁選擇「建立我的航線」或「立即試玩」。
2. 點擊音符建立節奏，也可以使用預設節奏或骰子隨機出題。
3. 將節奏加入「今日航線」。
4. 按下「啟航挑戰」。
5. 學生演奏後，由老師選擇「需要再一次」或「演奏成功」。
6. 答對時題目介面會淡出，完整播放航行與寶藏動畫。

遊戲畫面亦支援鍵盤操作：

- `←`：需要再一次
- `→`：演奏成功

關卡編輯器快捷鍵：

- `1`：四分音符
- `2`：八分音符
- `3`：四分休止符
- `4`：小節線

## 技術資訊

- HTML、CSS、原生 JavaScript
- [Three.js](https://threejs.org/) `0.160.0`
- Web Audio API
- Google Fonts
- Local Storage

Three.js 與 Google Fonts 目前透過 CDN 載入，因此首次開啟時需要網路連線。部署平台必須允許瀏覽器連線至相關 CDN。

## 瀏覽器建議

建議使用最新版：

- Google Chrome
- Microsoft Edge
- Safari
- Firefox

若瀏覽器啟用「減少動態效果」，部分轉場會自動縮短，以提升可及性。
## 更新現有部署
## Repository

[linyubert/rhythm-ocean](https://github.com/linyubert/rhythm-ocean)

