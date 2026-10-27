/* 青云剑仙 · Client 半身（v4）
 * 余额 / 今日已用 / 峰谷 · 泡泡点击序列（文本、余额、今日、峰谷、随机、并列加权、图片）
 * 逐行样式 · 悬浮改字 · 8 个姿态 · 音效 · 每轮消耗 · 深夜劝睡 · 余额告警 · 连点彩蛋 · 御剑
 * 由 build.py 从本模板生成 plugin/client.js。
 */
window.__ModuleLoader__.load({
  id: 'dsh-jianxian-widget',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'jianxian-widget';

    const POSES = {
      // v4 + v4b：18 个原画姿态，一一对应，不再借用
      idle: '__POSE_V4_IDLE__',
      greet: '__POSE_V5_GREET__',
      sword: '__POSE_V4_SWORD__',
      fly: '__POSE_V4_FLY__',
      ledger: '__POSE_V5_LEDGER__',
      shrug: '__POSE_V5_SHRUG__',
      refuse: '__POSE_V5_REFUSE__',
      bye: '__POSE_V5_SHEATH__',
      win: '__POSE_V4B_WIN__',
      angry: '__POSE_V4B_ANGRY__',
      poor: '__POSE_V4B_POOR__',
      coins: '__POSE_V4B_COINS__',
      forge: '__POSE_V4B_FORGE__',
      doze: '__POSE_V4B_DOZE__',
      yawn: '__POSE_V4B_YAWN__',
      tea: '__POSE_V4B_TEA__',
      sleep: '__POSE_V4B_DOZE__',
      meditate: '__POSE_V5_MEDITATE__',   // 打坐单独留一格（sleep 已改指打盹）
      back: '__POSE_V6_BACK__',
      sky: '__POSE_V6_SKY__',
      walk: '__POSE_V6_WALK__',
      // v11：半身近景四式
      sip: '__POSE_V11_SIP__',
      wipe: '__POSE_V11_WIPE__',
      chin: '__POSE_V11_CHIN__',
      // 剑舞四连：起势 / 上撩 / 横扫 / 收势
      // 剑舞 24 帧：起手 / 劈 / 撩 / 横扫 / 回旋 / 收势，各四式（即梦视频抽帧）
      dance01: '__POSE_DANCE16_01__',
      dance02: '__POSE_DANCE16_02__',
      dance03: '__POSE_DANCE16_03__',
      dance04: '__POSE_DANCE16_04__',
      dance05: '__POSE_DANCE16_05__',
      dance06: '__POSE_DANCE16_06__',
      dance07: '__POSE_DANCE16_07__',
      dance08: '__POSE_DANCE16_08__',
      dance09: '__POSE_DANCE16_09__',
      dance10: '__POSE_DANCE16_10__',
      dance11: '__POSE_DANCE16_11__',
      dance12: '__POSE_DANCE16_12__',
      dance13: '__POSE_DANCE16_13__',
      dance14: '__POSE_DANCE16_14__',
      dance15: '__POSE_DANCE16_15__',
      dance16: '__POSE_DANCE16_16__',
      dance17: '__POSE_DANCE16_17__',
      dance18: '__POSE_DANCE16_18__',
      dance19: '__POSE_DANCE16_19__',
      dance20: '__POSE_DANCE16_20__',
      dance21: '__POSE_DANCE16_21__',
      dance22: '__POSE_DANCE16_22__',
      dance23: '__POSE_DANCE16_23__',
      dance24: '__POSE_DANCE16_24__',
    };

    // 白衣版：23 个常驻动作 + 24 帧剑舞（sleep 复用打盹那张）
    const POSES_WHITE = {
      idle: '__POSE_WHITE_IDLE__',
      greet: '__POSE_WHITE_GREET__',
      sword: '__POSE_WHITE_SWORD__',
      fly: '__POSE_WHITE_FLY__',
      ledger: '__POSE_WHITE_LEDGER__',
      shrug: '__POSE_WHITE_SHRUG__',
      refuse: '__POSE_WHITE_REFUSE__',
      bye: '__POSE_WHITE_BYE__',
      win: '__POSE_WHITE_WIN__',
      angry: '__POSE_WHITE_ANGRY__',
      poor: '__POSE_WHITE_POOR__',
      coins: '__POSE_WHITE_COINS__',
      forge: '__POSE_WHITE_FORGE__',
      doze: '__POSE_WHITE_DOZE__',
      sleep: '__POSE_WHITE_DOZE__',   // 和黑衣一样：sleep 复用打盹那张
      dance01: '__POSE_WHITE_DANCE16_01__',
      dance02: '__POSE_WHITE_DANCE16_02__',
      dance03: '__POSE_WHITE_DANCE16_03__',
      dance04: '__POSE_WHITE_DANCE16_04__',
      dance05: '__POSE_WHITE_DANCE16_05__',
      dance06: '__POSE_WHITE_DANCE16_06__',
      dance07: '__POSE_WHITE_DANCE16_07__',
      dance08: '__POSE_WHITE_DANCE16_08__',
      dance09: '__POSE_WHITE_DANCE16_09__',
      dance10: '__POSE_WHITE_DANCE16_10__',
      dance11: '__POSE_WHITE_DANCE16_11__',
      dance12: '__POSE_WHITE_DANCE16_12__',
      dance13: '__POSE_WHITE_DANCE16_13__',
      dance14: '__POSE_WHITE_DANCE16_14__',
      dance15: '__POSE_WHITE_DANCE16_15__',
      dance16: '__POSE_WHITE_DANCE16_16__',
      dance17: '__POSE_WHITE_DANCE16_17__',
      dance18: '__POSE_WHITE_DANCE16_18__',
      dance19: '__POSE_WHITE_DANCE16_19__',
      dance20: '__POSE_WHITE_DANCE16_20__',
      dance21: '__POSE_WHITE_DANCE16_21__',
      dance22: '__POSE_WHITE_DANCE16_22__',
      dance23: '__POSE_WHITE_DANCE16_23__',
      dance24: '__POSE_WHITE_DANCE16_24__',
      yawn: '__POSE_WHITE_YAWN__',
      tea: '__POSE_WHITE_TEA__',
      meditate: '__POSE_WHITE_MEDITATE__',
      back: '__POSE_WHITE_BACK__',
      sky: '__POSE_WHITE_SKY__',
      walk: '__POSE_WHITE_WALK__',
      sip: '__POSE_WHITE_SIP__',
      wipe: '__POSE_WHITE_WIPE__',
      chin: '__POSE_WHITE_CHIN__',
    };

    // 温馨提示：按类别轮转，每类几句备选（青云剑仙口吻：短、稳、半命令半关心）
    const WELLNESS = [
      { kind: 'water', pose: 'tea', lines: [
        '该喝水了。剑等得起，你的嗓子等不起。',
        '去倒杯水。这一局我替你看着。',
        '水。现在。别让我说第二遍。',
        '嘴唇都干了。茶也行，但得喝。',
      ] },
      { kind: 'rest', pose: 'sleep', lines: [
        '眼睛歇一会儿。盯太久，剑气都会糊。',
        '停一刻钟。天塌不下来。',
        '该歇了。我在这儿站着，跑不了。',
        '闭眼，数三十息。数完再碰键盘。',
      ] },
      { kind: 'move', pose: 'walk', lines: [
        '站起来走两步。坐久了腰会废。',
        '起身，绕着屋子转一圈再回来。',
        '你颈子硬得像块铁。去走走。',
        '该活动了。走两步，回来接着说。',
      ] },
      { kind: 'eyes', pose: 'sky', lines: [
        '抬头，看远处。窗外什么都行。',
        '揉揉眉心。别揉到眼睛里去。',
        '二十息：看六米外的东西，一次。',
      ] },
      { kind: 'meal', pose: 'tea', lines: [
        '到饭点了。人是铁，剑也是铁，都得喂。',
        '去吃饭。我不催你干活。',
        '别拿饼干当饭。',
      ] },
    ];

    // 每个姿态的「可点击轮廓」：{ ar: 图片宽高比, box: [x0,y0,w,h] 占图片比例 }。
    // 构建时从 src/hitboxes.json 注入（tools/make_hitboxes.py 逐张量 alpha 轮廓）。
    const HIT_BOX = __HIT_BOXES__;

    // 立绘几何的唯一真源（构建时从 src/layout.json 注入）。
    // 缩放原点、头顶到法宝的间距、坐姿缩放系数都只在这里；渲染层不许再写裸数字。
    const LAYOUT = __LAYOUT__;

    // 法宝/气泡的抬升量（CSS 变量 --yo）。全项目只有这一处算它。
    //   头顶距 root 顶边 = rootH×(1 − fit×(1 − box.top))
    //   fit 来自 layout.poseFit（打坐/守炉/打盹这三张按脚底为原点缩小过）
    //   缩放原点在 originY×rootH，头顶随倍率上升的量按它换算
    // 剑舞帧的头在图上位置各不相同，跟着走会每 80ms 抖一次 —— 所以剑舞按站姿口径（不跟姿态）。
    function gearLift(poseName, scale) {
      const dancing = /^dance/.test(String(poseName || ''));
      const b = (dancing ? HIT_BOX.idle : (HIT_BOX[poseName] || HIT_BOX.idle)).box[1];
      const fit = dancing ? 1 : ((LAYOUT.poseFit || {})[poseName] || 1);
      const originY = LAYOUT.rootH * LAYOUT.originY;
      const headTop = LAYOUT.rootH * (1 - fit * (1 - b));
      // headGap + gearBase − gearMargin 正好等于「法宝底边离 root 顶边」，站姿下就是 22px
      const gearBottom = LAYOUT.headGap + LAYOUT.gearBase - LAYOUT.gearMargin;
      return Math.round((gearBottom - headTop) + (scale - 1) * (originY - headTop));
    }

    // 法宝：菜单按钮的外观（玉印最像权威）— 2026-10-25 重做，14 件
    const TALISMANS = {
      seal: '__TALISMAN_SEAL__',
      mirror: '__TALISMAN_MIRROR__',
      bell: '__TALISMAN_BELL__',
      gourd: '__TALISMAN_GOURD__',
      ruyi: '__TALISMAN_RUYI__',
      pouch: '__TALISMAN_POUCH__',
      vase: '__TALISMAN_VASE__',
      compass: '__TALISMAN_COMPASS__',
      flute: '__TALISMAN_FLUTE__',
      banner: '__TALISMAN_BANNER__',
      fuchen: '__TALISMAN_FUCHEN__',
      fan: '__TALISMAN_FAN__',
      tally: '__TALISMAN_TALLY__',
      lamp: '__TALISMAN_LAMP__',
    };
    const TALISMAN_ORDER = ['seal', 'mirror', 'bell', 'gourd', 'ruyi', 'pouch', 'vase', 'compass', 'flute', 'banner', 'fuchen', 'fan', 'tally', 'lamp'];
    // v4.13：14 张用 1536 原图重做（rembg + pymatting + alpha 提亮）后，按"内容面积"再补一点，
    // 让 28px 下视觉重量接近：sqrt(0.62 / 面积)，上限 1.25（再多就顶出按钮）。
    // 系数统一按 sqrt(0.62 / 内容面积) 算，钳在 0.85–1.25：
    // 大的（方印/铜镜/罗盘）缩一点，小的（笛/瓶/葫芦）放一点，目标都是 62% 面积。
    const TALISMAN_FIT = {
      compass: 0.86, mirror: 0.87, bell: 0.87, fuchen: 0.87, seal: 0.89, ruyi: 0.89,
      pouch: 0.93, lamp: 1.00, banner: 1.03, tally: 1.05, fan: 1.08, gourd: 1.09,
      flute: 1.25, vase: 1.25,
    };
    const TALISMAN_NAMES = { seal: '青玉方印', mirror: '八卦铜镜', bell: '招魂铃', gourd: '紫金葫芦',
      ruyi: '玉如意', pouch: '乾坤袋', vase: '白瓷净瓶', compass: '司南罗盘', flute: '青玉笛', banner: '引魂幡',
      fuchen: '白玉拂尘', fan: '山水折扇', tally: '玄木令牌', lamp: '长明灯' };

    const SFX = {
      press: '__SFX_PRESS__',
      release: '__SFX_RELEASE__',
      turn: '__SFX_TURN__',
      bubble: '__SFX_BUBBLE__',
      panel: '__SFX_PANEL__',
      pick: '__SFX_PICK__',
      alert: '__SFX_ALERT__',
      cloth: '__SFX_CLOTH__',
      wind: '__SFX_WIND__',
      bell: '__SFX_BELL__',
    };

    // 背光颜色表（模块级，避免每次渲染重建）
    const GLOW_RGB = { purple: '148,92,238', red: '220,90,90', cyan: '122,204,225', gold: '230,200,110' };
    // 外观三件套（主题 / 衣装 / 背光）统一解析：以后加新的外观维度只改这里
    function readView(cfg, scheme) {
      const ui = (cfg && cfg.ui) || {};
      const themePref = ui.theme || 'auto';
      const isLight = themePref === 'light' || (themePref === 'auto' && scheme === 'light');
      const outfitPref = ui.outfit || 'auto';
      const useWhite = outfitPref === 'white' || (outfitPref === 'auto' && isLight);
      const glowPref = ui.glow || 'auto';
      const glowAlpha = Number(ui.glowAlpha) || 0.65;
      const glowRgb = glowPref === 'auto'
        ? (useWhite ? GLOW_RGB.red : GLOW_RGB.purple)
        : (GLOW_RGB[glowPref] || GLOW_RGB.purple);
      return { themePref, isLight, outfitPref, useWhite, glowPref, glowAlpha, glowRgb };
    }
    // 二级分段按钮样式（主题 / 衣装 / 背光那几行共用）
    const SEG_MD = { flex: '0 0 auto', padding: '5px 7px', fontSize: 11 };
    const SEG_SM = { flex: '0 0 auto', padding: '5px 5px', fontSize: 11 };

    const DEFAULT_CONFIG = {
      version: 10,
      style: { bg: 'linear-gradient(180deg,rgba(20,22,25,.985),rgba(7,8,10,.985))', color:'var(--xjj-bub-text)', fontSize: 14, radius: 13, maxWidth: 296 },
      sound: { on: true, volume: 0.5, press: true, release: true, turn: true, bubble: true, panel: true, pick: true, alert: true, cloth: true, wind: true, bell: true },
      warn: { balanceLow: 10 },
      budget: { daily: 0 },          // 今日预算（元），0 = 关
      lineLib: [],                   // 气泡编辑器里的「常用行」库
      chatter: { on: true, everyMin: 10 },
      bubbleOn: true,
      bubbleHoldSec: 3,
      notice: { lateNight: true, lowBalance: true, turnCost: true, wellness: true, askWait: true, approveWait: true },
      wellness: { everyMin: 30 },
      ui: { scale: 1, anchor: 'br', dx: 6, dy: 10, mirror: true, theme: 'auto', outfit: 'auto', glow: 'auto', glowAlpha: 0.65 },
      texts: {
        lowBalance: '灵石不多了（{v}），省着点用。',
        lateNight: '子时了。剑也该归鞘，你也该睡了。',
        lateNag: '别点了，去睡。',
        fly: '御剑去看看。',
        turnTitle: '本轮消耗',
        turnCost: '-{cost} · {tokens} tok',
        busy: '炼丹中……别催。',
        waitAsk: '东家，{session}在等你答话。',
        waitApprove: '有件事要你点头（{session}）。',
        budget: '今天已经用掉 {v}，到预算 {cap} 了。',
      },
      idle: [
        { text: '剑在鞘中，也在心里。', pose: 'idle' },
        { text: '今日也要勤加修炼。', pose: 'sword', sfx: 'bell' },
        { text: '心若冰清，天塌不惊。', pose: 'sleep' },
        { text: '灵石不够？先记账。', pose: 'ledger' },
        { text: '你忙你的，我替你守着。', pose: 'back' },
        { text: '天要晚了，剑要归鞘，人要睡。', pose: 'bye' },
        { text: '这一式，叫顺手牵羊。', pose: 'win', extra: '（剑没动，人也没动）' },
        { text: '别催，火候不到。', pose: 'forge' },
        { text: '喝口茶，慢慢来。', pose: 'tea', sfx: 'pick' },
        { text: '山高路远，先看脚下。', pose: 'walk', sfx: 'cloth' },
        { text: '今日无事，便是好事。', pose: 'sky' },
        { text: '我又不是账房先生……行吧，我是。', pose: 'shrug', extra: '（翻开玉简）' },
        { text: '剑气纵横三万里，余额只剩两位数。', pose: 'poor' },
        { text: '你走神了？我也走了。', pose: 'doze' },
        { text: '别熬夜，熬坏了剑鞘赔不起。', pose: 'yawn' },
        { text: '有人喊我？没有啊。', pose: 'greet' },
        { text: '山那边，云比人忙。', pose: 'sky' },
        { text: '小酌一口，剑气也温了。', pose: 'sip', sfx: 'pick' },
        { text: '剑要常擦，话要少说。', pose: 'sword', sfx: 'cloth' },
        { text: '嗯……这一步，走岔了。', pose: 'chin' },
      ],
      first: {
        lines: [
          { style: { fontSize: 14, fontWeight: 700, letterSpacing: 2 }, modules: [{ type: 'text', text: '道 友 ， 请 留 步 。' }] },
          {
            style: { marginTop: 4 },
            modules: [
              { type: 'text', text: '余额 ', style: { color:'var(--xjj-bub-dim)' } },
              { type: 'balance', style: { color:'var(--xjj-bub-cyan)', fontWeight: 700, fontSize: 14 } },
            ],
          },
          {
            modules: [
              { type: 'text', text: '今日 ', style: { color:'var(--xjj-bub-dim)' } },
              { type: 'today', style: { color:'var(--xjj-bub-warn)', fontWeight: 700, fontSize: 14 } },
            ],
          },
          {
            style: { marginTop: 2, fontSize: 14, color:'var(--xjj-bub-dim)', letterSpacing: 1 },
            modules: [{ type: 'peak', fmt: '{label} · 距{next} {cd}' }],
          },
        ],
      },
      queue: [
        {
          id: 'present',
          title: '本座在此',
          pose: 'idle',
          variants: [
            {
              weight: 2,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '本座在此。' }] },
                {
                  style: { marginTop: 2 },
                  modules: [{
                    type: 'random',
                    items: [
                      { text: '有事直说，别绕。', weight: 3 },
                      { text: '剑在鞘中，也在心里。', weight: 2 },
                      { text: '心若冰清，天塌不惊。', weight: 1 },
                    ],
                  }],
                },
              ],
            },
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '贫道先走一步。' }] },
                { style: { marginTop: 2, fontSize: 14, color:'var(--xjj-bub-dim)' }, modules: [{ type: 'text', text: '（其实是去记账）' }] },
              ],
            },
          ],
        },
        {
          id: 'gems',
          title: '数灵石',
          pose: 'coins',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '数一数今天的灵石。' }] },
                {
                  style: { marginTop: 3 },
                  modules: [
                    { type: 'text', text: '今日 ' },
                    { type: 'turns', style: { color:'var(--xjj-bub-cyan)', fontWeight: 700 } },
                    { type: 'text', text: ' 轮' },
                  ],
                },
                {
                  style: { marginTop: 2, fontSize: 14, color:'var(--xjj-bub-dim)' },
                  modules: [{ type: 'text', text: '已用 ' }, { type: 'today', style: { color:'var(--xjj-bub-cyan)' } }],
                },
              ],
            },
          ],
        },
        {
          id: 'salute',
          title: '作揖',
          pose: 'greet',
          variants: [
            {
              weight: 2,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '见礼。' }] },
                {
                  style: { marginTop: 2 },
                  modules: [{
                    type: 'random',
                    items: [
                      { text: '礼数要到，剑不收。', weight: 3 },
                      { text: '你忙你的，我在旁边站着。', weight: 2 },
                      { text: '一礼既毕，各做各事。', weight: 1 },
                    ],
                  }],
                },
              ],
            },
          ],
        },
        {
          id: 'shrug',
          title: '摊手',
          pose: 'shrug',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '这事我也没辙。' }] },
                { style: { marginTop: 2 }, modules: [{ type: 'random', items: [{ text: '该问的还得你自己去问。', weight: 3 }, { text: '我只是个看炉子的。', weight: 2 }] }] },
              ],
            },
          ],
        },
        {
          id: 'fist',
          title: '举拳',
          pose: 'win',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '此局成了。' }] },
                { style: { marginTop: 2 }, modules: [{ type: 'random', items: [{ text: '收工不庆功，先记账。', weight: 3 }, { text: '下一轮照这样走。', weight: 2 }] }] },
              ],
            },
          ],
        },
        {
          id: 'cold',
          title: '冷怒',
          pose: 'angry',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '别拿废稿糊弄我。' }] },   // 去掉写死的粉，改回继承暖色
                { style: { marginTop: 2 }, modules: [{ type: 'random', items: [{ text: '重做一遍，比解释省事。', weight: 3 }, { text: '这种错，下次别再犯。', weight: 2 }] }] },
              ],
            },
          ],
        },
        {
          id: 'ledger',
          title: '账目',
          pose: 'ledger',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 14, fontWeight: 700 }, modules: [{ type: 'text', text: '灵石账目' }] },
                { style: { marginTop: 3 }, modules: [{ type: 'text', text: '余额 ' }, { type: 'balance', style: { color:'var(--xjj-bub-cyan)', fontWeight: 700 } }] },
                { modules: [{ type: 'text', text: '今日 ' }, { type: 'today', style: { color:'var(--xjj-bub-cyan)', fontWeight: 700 } }] },
                { style: { fontSize: 14, color:'var(--xjj-bub-dim)', marginTop: 2 }, modules: [{ type: 'peak' }] },
              ],
            },
          ],
        },
        {
          id: 'sword',
          title: '剑来',
          pose: 'wipe',
          variants: [
            {
              weight: 1,
              lines: [
                { style: { fontSize: 15, fontWeight: 700, letterSpacing: 2 }, modules: [{ type: 'text', text: '剑 来 。' }] },
                { style: { marginTop: 2, fontSize: 14, color:'var(--xjj-bub-dim)' }, modules: [{ type: 'peak', fmt: '此刻{label}，{cd}后转{next}' }] },
              ],
            },
          ],
        },
      ],
    };

    const CSS = [
      '.xjj-root{--xjj-bub-bg:#0d1218;--xjj-bub-border:rgba(217,164,65,.55);--xjj-bub-text:#F3E6C8;--xjj-bub-gold:#F5C24B;--xjj-bub-cyan:#9FE7F5;--xjj-bub-dim:#A9B6BE;--xjj-bub-warn:#FFB3A7;--xjj-bub-shadow:0 12px 30px rgba(4,9,14,.55),0 0 16px rgba(79,179,200,.12)}',
      '.xjj-root.is-light{--xjj-bub-bg:#FFFDF7;--xjj-bub-border:#D9C48E;--xjj-bub-text:#2A2418;--xjj-bub-gold:#8A5F16;--xjj-bub-cyan:#1F6B7A;--xjj-bub-dim:#5A4E38;--xjj-bub-warn:#A8402E;--xjj-bub-shadow:0 10px 24px rgba(90,70,30,.16)}',
            '.xjj-root{--xjj-ed-a:rgba(26,21,16,.99);--xjj-ed-b:rgba(9,7,5,.99);--xjj-ed-border:rgba(217,164,65,.55);--xjj-ed-head:rgba(217,164,65,.12);--xjj-panel-a:#0f151b;--xjj-panel-b:#0b0f14;--xjj-border:rgba(255,255,255,.075);--xjj-divider:rgba(255,255,255,.07);--xjj-divider-soft:rgba(255,255,255,.055);--xjj-card:rgba(255,255,255,.035);--xjj-control-bg:rgba(255,255,255,.04);--xjj-control-bg-2:rgba(255,255,255,.05);--xjj-control-bg-3:rgba(255,255,255,.02);--xjj-control-bg-hover:rgba(255,255,255,.11);--xjj-control-border:rgba(255,255,255,.06);--xjj-control-border-2:rgba(255,255,255,.08);--xjj-control-border-3:rgba(255,255,255,.12);--xjj-control-border-4:rgba(255,255,255,.16);--xjj-text:#E8EEF3;--xjj-text-strong:#F1F5F8;--xjj-text-2:#DCE4E8;--xjj-text-3:#C9D3E0;--xjj-text-dim:#8B98A4;--xjj-text-hover:#C9D4DC;--xjj-label:#93A2AE;--xjj-muted:#7C8B98;--xjj-muted-2:#9FAEB6;--xjj-value:#E4EAF0;--xjj-gold:#D9A441;--xjj-gold-text:#E7C892;--xjj-gold-soft:#F1C97A;--xjj-yellow:#F1C651;--xjj-green:#57C795;--xjj-red:#FF5F5F;--xjj-red-strong:#FF2A2A;--xjj-red-soft:#FF8A8A;--xjj-shadow:0 18px 40px rgba(0,0,0,.55);--xjj-glow-rgb:148,92,238;--xjj-glow-a:.65}',
      '.xjj-root.is-w-robe{--xjj-glow-rgb:220,90,90}',
      '.xjj-root.is-light.is-w-robe{--xjj-glow-rgb:220,90,90}',   // 浅色+白袍：特异性压过 .is-light
            '.xjj-root.is-light{--xjj-ed-a:rgba(255,253,247,.99);--xjj-ed-b:rgba(244,237,221,.99);--xjj-ed-border:#D9C48E;--xjj-ed-head:rgba(169,118,31,.10);--xjj-panel-a:#FBF7EE;--xjj-panel-b:#F4EDDD;--xjj-border:#E2D6BC;--xjj-divider:rgba(90,70,30,.14);--xjj-divider-soft:rgba(90,70,30,.1);--xjj-card:#FFFFFF;--xjj-control-bg:#FFFFFF;--xjj-control-bg-2:#F7F0E1;--xjj-control-bg-3:#FAF5EA;--xjj-control-bg-hover:#F0E7D4;--xjj-control-border:#E2D6BC;--xjj-control-border-2:#D8C9A8;--xjj-control-border-3:#CDBC97;--xjj-control-border-4:#BFA97E;--xjj-text:#2A2418;--xjj-text-strong:#1C1810;--xjj-text-2:#3D3424;--xjj-text-3:#5A4E38;--xjj-text-dim:#6B5F4A;--xjj-text-hover:#3D3424;--xjj-label:#6B5F4A;--xjj-muted:#74674E;--xjj-muted-2:#74674E;--xjj-value:#2A2418;--xjj-gold:#A9761F;--xjj-gold-text:#8A5F16;--xjj-gold-soft:#7A5310;--xjj-yellow:#9A6B00;--xjj-green:#1E7A4C;--xjj-red:#B23434;--xjj-red-strong:#C41E1E;--xjj-red-soft:#D46A6A;--xjj-shadow:0 14px 30px rgba(90,70,30,.18);--xjj-glow-rgb:148,92,238;--xjj-glow-a:.65}',
      '.xjj-root{position:fixed;right:14px;bottom:10px;width:176px;height:270px;pointer-events:none;font-family:inherit;z-index:6;transform-origin:100% 100%;-webkit-user-select:none;user-select:none}',
      '.xjj-sprite.is-on{animation:xjj-breathe 5.4s ease-in-out infinite}',
      '@keyframes xjj-breathe{0%,100%{filter:drop-shadow(0 0 9px rgba(var(--xjj-glow-rgb),var(--xjj-glow-a,.65)))}50%{filter:drop-shadow(0 0 21px rgba(var(--xjj-glow-rgb),var(--xjj-glow-a,.65)))}}',
      '.xjj-mote{position:absolute;bottom:36%;width:5px;height:5px;border-radius:50%;background:radial-gradient(circle,#e6fbff,#7fd3ea 55%,rgba(127,211,234,0));box-shadow:0 0 9px rgba(150,225,245,.85);animation:xjj-mote 5.2s linear infinite;pointer-events:none}',
      '@keyframes xjj-mote{0%{opacity:0;transform:translateY(8px) scale(.5)}18%{opacity:.95}100%{opacity:0;transform:translateY(-52px) scale(1.05)}}',
      '.xjj-stage{position:absolute;left:0;right:0;bottom:0;height:100%;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;cursor:pointer;transform-origin:50% 100%;animation:xjj-float 5.2s ease-in-out infinite;outline:none;-webkit-tap-highlight-color:transparent}',
      '.xjj-stage:focus-visible{border-radius:16px;filter:drop-shadow(0 0 7px rgba(122,204,225,.95))}',
      '@keyframes xjj-float{0%,100%{transform:translateY(0px) scale(calc(var(--xs,1) * var(--xm,1)), var(--xs,1))}50%{transform:translateY(-7px) scale(calc(var(--xs,1) * var(--xm,1)), var(--xs,1))}}',
      '.xjj-sprite{position:absolute;bottom:0;left:calc(50% - var(--xjx-shift, 0px));height:100%;width:auto;opacity:0;transform:translateX(-50%);transition:none;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 7px 11px rgba(16,38,58,.22));z-index:1}',
      '.xjj-sprite.is-on{opacity:1}',
      // 命中层：外框 = 立绘图片框（aspect-ratio 由姿态决定），内框 = 实测的不透明轮廓
      '.xjj-hitwrap{position:absolute;bottom:0;left:calc(50% - var(--xjx-shift, 0px));height:100%;transform:translateX(-50%);pointer-events:none;z-index:2}',
      '.xjj-hit{position:absolute;pointer-events:auto;cursor:pointer;border-radius:46% 46% 30% 30%}',
      '.xjj-shadow{opacity:.35;position:absolute;bottom:-1px;left:calc(50% - var(--xjx-shift, 0px));width:104px;height:16px;margin-left:-52px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(16,38,58,.28),rgba(16,38,58,0) 70%);filter:blur(2px);pointer-events:none}',
      '.xjj-bubble{position:absolute;right:100%;margin-right:12px;bottom:calc(56% + var(--yo, 0px));width:max-content;min-width:132px;padding:9px 12px;border-radius:13px;padding-top:12px;box-shadow:var(--xjj-bub-shadow);background:var(--xjj-bub-bg);border:1px solid var(--xjj-bub-border);font-family:"KaiTi","STKaiti","楷体","Microsoft YaHei",serif;letter-spacing:.4px;animation:xjj-bubble-in .18s ease-out both;pointer-events:auto;cursor:pointer;box-sizing:border-box;line-height:1.5}',
      '.xjj-bubble::before{left:6px;right:6px;top:4px;height:1px;content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(120% 90% at 50% 120%,rgba(79,179,200,.10),transparent 60%)}',
      '@keyframes xjj-bubble-in{from{opacity:0;transform:translateY(5px) scale(.97)}to{opacity:1;transform:none}}',
      '.xjj-line{display:flex;flex-wrap:wrap;align-items:center;gap:0 2px;position:relative}',
      '.xjj-bubble .xjj-line + .xjj-line{border-top:1px dashed rgba(217,164,65,.22);padding-top:5px;margin-top:5px}',
      '.xjj-slash{position:absolute;bottom:40%;left:50%;width:136px;height:6px;margin-left:-68px;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,0),#f2feff 45%,rgba(255,255,255,0));box-shadow:0 0 16px rgba(200,244,255,.95);animation:xjj-slash .62s ease-out both;pointer-events:none}',
      '.xjj-slash.b{height:4px;width:110px;margin-left:-55px;bottom:52%;animation-delay:.08s}',
      '@keyframes xjj-slash{0%{opacity:0;transform:translate(-46%,6px) rotate(-17deg) scaleX(.35)}26%{opacity:1}100%{opacity:0;transform:translate(46%,-16px) rotate(-17deg) scaleX(1.05)}}',
      '.xjj-gear{position:absolute;right:20px;bottom:calc(100% + var(--yo, 0px) - var(--gear-base, 15px));margin-bottom:var(--gear-mb, 2px);z-index:9;width:64px;height:64px;padding:0;border:0;background:transparent;pointer-events:auto;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .16s ease,opacity .16s ease;outline:none}',
      '.xjj-gear:hover{transform:translateY(-1px) scale(1.08) rotate(-4deg);filter:drop-shadow(0 3px 9px rgba(217,164,65,.55));opacity:1}',
      '.xjj-tal{width:58px;height:58px;object-fit:contain;pointer-events:none;user-select:none}',
      '.xjj-gear:hover .xjj-tal{filter:drop-shadow(0 0 6px rgba(217,164,65,.7))}',
      '.xjj-root:hover .xjj-gear{opacity:.92}',
      '.xjj-panel{position:absolute;right:0;bottom:calc(100% + var(--yo, 0px) + 44px);margin-bottom:6px;display:flex;flex-direction:column;isolation:isolate;width:272px;max-height:56vh;background:linear-gradient(180deg,var(--xjj-panel-a),var(--xjj-panel-b));border:1px solid var(--xjj-border);border-radius:12px;box-shadow:var(--xjj-shadow);pointer-events:auto;z-index:9;overflow:hidden;font-family:"Microsoft YaHei","PingFang SC",sans-serif}',
      '.xjj-head::before{content:"";width:6px;height:6px;border-radius:50%;background:#5AD6A0;box-shadow:0 0 8px rgba(90,214,160,.7);flex:none;margin-right:1px}',
      '.xjj-head{border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:13px 13px 10px;cursor:move;user-select:none;touch-action:none;position:relative}',
      '.xjj-head b{font-size:12.5px;color:var(--xjj-text);letter-spacing:.6px;font-weight:600;flex:1 1 auto;min-width:0}',
      // 英文标题是一整句（Azure Cloud Sword Immortal）：272px 面板里必须一行放下。
      // 做法：字距归零、12px、去掉尾部 ◇（省 11px），再留 ellipsis 兜底（余额特别长时才截）
      '.xjj-root.is-en .xjj-head b{font-size:12px;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;min-width:0;max-width:none}',
      '.xjj-root.is-en .xjj-head b::after{content:none}',
      '.xjj-root.is-en .xjj-head span{flex:none;margin-left:0}',
      '.xjj-head span{font-size:11px;color:var(--xjj-gold);font-family:"Microsoft YaHei",sans-serif;font-variant-numeric:tabular-nums}',
      '.xjj-head span.is-green{color:var(--xjj-green);font-weight:700;text-shadow:0 0 8px rgba(80,220,140,.45)}',
      '.xjj-head span.is-yellow{color:var(--xjj-yellow);font-weight:700;text-shadow:0 0 8px rgba(240,190,70,.45)}',
      '.xjj-head span.is-low{color:var(--xjj-red);font-weight:800;text-shadow:0 0 10px rgba(255,70,70,.55),0 0 2px rgba(255,180,180,.8)}',
      '.xjj-head span.is-critical{font-weight:800;animation:xjj-crit 1.15s ease-in-out infinite}',
      '@keyframes xjj-crit{0%,100%{color:var(--xjj-red-strong);text-shadow:0 0 4px rgba(255,20,20,.85),0 0 2px rgba(255,255,255,.55)}50%{color:var(--xjj-red-soft);text-shadow:0 0 14px rgba(255,60,60,.95),0 0 4px rgba(255,230,230,.8)}}',
      '.xjj-tabs{display:flex;gap:6px;border-bottom:1px solid var(--xjj-divider);padding:0 12px;}',
      '.xjj-tab{flex:1 1 0;min-width:0;border:0;background:none;color:var(--xjj-text-dim);font-size:11.5px;padding:4px 0 9px;border-radius:0;cursor:pointer;font-family:inherit;letter-spacing:.4px;position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .15s ease}',
      '.xjj-tab:hover{color:var(--xjj-text-hover);background:none}',
      '.xjj-tab:focus-visible{outline:1px solid rgba(255,255,255,.55);outline-offset:-2px;border-radius:0}',
      '.xjj-tab.on{color:var(--xjj-text-strong);font-weight:600;background:none}',
      '.xjj-tab.on::after{content:"";position:absolute;left:4px;right:4px;bottom:-1px;height:2px;border-radius:2px;background:var(--xjj-gold)}',
      '.xjj-root.is-en .xjj-tab{font-size:11px;letter-spacing:0;padding:4px 0 9px}',
      '.xjj-body{padding:12px 13px 14px;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(217,164,65,.55) transparent}',
      '.xjj-body::-webkit-scrollbar{width:8px}',
      '.xjj-body::-webkit-scrollbar-track{background:transparent}',
      '.xjj-body::-webkit-scrollbar-thumb{background:rgba(217,164,65,.45);border-radius:5px;border:2px solid transparent;background-clip:content-box}',
      '.xjj-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 2px;border-radius:0;border-bottom:1px solid var(--xjj-divider-soft)}',
      '.xjj-row:hover{background:var(--xjj-card)}',
      '.xjj-rowmain{display:flex;flex-direction:column;gap:1px}',
      '.xjj-lbl{font-size:11.5px;color:var(--xjj-label)}',
      '.xjj-rowmain small{font-size:11px;color:var(--xjj-muted);opacity:1;font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-val{font-size:11.5px;color:var(--xjj-value);font-weight:600;font-variant-numeric:tabular-nums;font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-hist{display:block;padding:10px 2px 0;border-radius:0;background:none;border:0;border-top:1px solid var(--xjj-divider-soft);margin-top:8px}',
      '.xjj-hist-head{display:flex;align-items:baseline;justify-content:space-between;gap:6px;margin-bottom:5px}',
      '.xjj-hist-sum{font-size:11px;color:var(--xjj-gold-text);font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-bars{display:flex;align-items:flex-end;gap:4px;height:58px}',
      '.xjj-bar-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px}',
      '.xjj-bar-val{font-size:11px;letter-spacing:-.2px;color:var(--xjj-text-3);line-height:1;font-family:"Microsoft YaHei",sans-serif;white-space:nowrap}',
      '.xjj-bar-track{width:100%;height:34px;display:flex;align-items:flex-end;background:transparent;border-bottom:1px solid rgba(217,164,65,.28);border-radius:3px 3px 0 0;overflow:hidden}',
      '.xjj-bar-fill{width:100%;background:var(--xjj-gold);border-radius:3px 3px 0 0;min-height:2px;transition:height .3s ease}',
      '.xjj-bar-fill.today{background:var(--xjj-green)}',
      '.xjj-bar-day{font-size:11px;letter-spacing:-.2px;color:var(--xjj-text-3);opacity:1;line-height:1;font-family:"Microsoft YaHei",sans-serif;white-space:nowrap}',
      '.xjj-seg{display:flex;gap:4px;padding:2px 4px 6px}',
      // flex-basis 0 + min-width 0：三段严格等宽。之前只写 flex:1，'近 7 天' 比 '今日' 宽，三段就参差了
      '.xjj-seg-b{flex:1 1 0;min-width:0;text-align:center;white-space:nowrap;border:1px solid var(--xjj-control-border-2);background:var(--xjj-control-bg);color:var(--xjj-text-2);font-size:11px;padding:6px 0;border-radius:7px;cursor:pointer;font-family:inherit}',
      '.xjj-seg-b.on{background:rgba(217,164,65,.16);color:var(--xjj-gold-soft);border-color:rgba(217,164,65,.45);font-weight:600}',
      // 合计行允许换行：近 7 天 / 全部 的金额更长（¥143.90），原来 nowrap + space-between 会把右边的小字挤出面板
      '.xjj-usage-sum{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;column-gap:8px;row-gap:1px;padding:2px 4px 8px;border-bottom:1px solid var(--xjj-control-border)}',
      '.xjj-usage-sum b{font-size:18px;color:var(--xjj-text-strong);font-family:"Microsoft YaHei",sans-serif;flex:0 0 auto}',
      '.xjj-usage-sum span{font-size:11px;color:var(--xjj-text-3);min-width:0;white-space:nowrap}',
      '.xjj-search{padding:6px 4px 2px}',
      '.xjj-search-in{width:100%;box-sizing:border-box;background:var(--xjj-control-bg-2);border:1px solid var(--xjj-control-border-2);border-radius:7px;color:var(--xjj-text);font-size:11px;padding:5px 8px;font-family:inherit;outline:none}',
      '.xjj-search-in::placeholder{color:var(--xjj-muted);opacity:1}',
      '.xjj-search-in:focus{border-color:rgba(240,206,134,.8)}',
      '.xjj-models{padding:10px 11px;display:flex;flex-direction:column;gap:6px;margin-top:6px;border-radius:9px;background:var(--xjj-card);border:1px solid var(--xjj-divider-soft)}',
      '.xjj-model{display:flex;flex-direction:column;gap:2px}',
      '.xjj-model-head{display:flex;justify-content:space-between;gap:6px;font-size:11px;color:var(--xjj-text-2)}',
      '.xjj-model-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:112px}',
      '.xjj-model-val{color:var(--xjj-gold-text);font-family:"Microsoft YaHei",sans-serif;flex:none}',
      '.xjj-model-track{height:5px;background:var(--xjj-control-border-2);border-radius:3px;overflow:hidden}',
      '.xjj-model-fill{height:100%;background:linear-gradient(90deg,#8AE7BE,#3FAF80);border-radius:3px}',
      '.xjj-list{max-height:170px;overflow-y:auto;margin:6px 0 2px;border-top:1px solid var(--xjj-control-border);padding-top:4px;scrollbar-width:thin;scrollbar-color:rgba(217,164,65,.45) transparent}',
      '.xjj-item{display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 4px;border-radius:5px;color:var(--xjj-text-2)}',
      '.xjj-item:hover{background:rgba(217,164,65,.08)}',
      '.xjj-item-t{color:var(--xjj-muted-2);flex:none;font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-item-m{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.xjj-item-v{flex:none;color:var(--xjj-gold-text);font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-empty{font-size:11px;color:var(--xjj-muted-2);padding:8px 6px;text-align:center}',
      // 与明细金额同色（var(--xjj-gold-text)），不再压透明度 —— 这行小字要跟 ¥0.09 一个颜色
      '.xjj-ret{font-size:12px;color:var(--xjj-muted);padding:6px 6px 0;line-height:1.5}',
      '.xjj-ed{position:fixed;top:6vh;right:18px;width:min(420px,calc(100vw - 28px));max-height:78vh;display:flex;flex-direction:column;pointer-events:auto;background:linear-gradient(180deg,var(--xjj-ed-a),var(--xjj-ed-b));border:1px solid var(--xjj-ed-border);border-radius:11px;box-shadow:0 18px 48px rgba(0,0,0,.62),inset 0 0 0 1px rgba(255,240,205,.06);color:var(--xjj-text);z-index:40;overflow:hidden;font-size:11.5px}',
      '.xjj-ed-confirm{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--xjj-text-2);flex:none}',
      '.xjj-ed-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid var(--xjj-divider);font-size:12.5px;letter-spacing:1px;color:var(--xjj-text);background:linear-gradient(180deg,var(--xjj-ed-head),transparent)}',
      '.xjj-ed-body{overflow:auto;padding:8px 10px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:var(--xjj-control-border-4) transparent}',
      '.xjj-ed-foot{display:flex;gap:8px;justify-content:flex-end;padding:8px 10px;border-top:1px solid var(--xjj-divider-soft);background:linear-gradient(0deg,var(--xjj-ed-head),transparent)}',
      '.xjj-ed-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0}',
      '.xjj-ed-s{font-size:11px;color:var(--xjj-muted-2);letter-spacing:.5px;flex:none}',
      // 行卡套模块框是有意的层次（2026-10-27 他定：保留层次，不压平）；检测器的 nested-cards 属已知项
      '.xjj-ed-line{border:1px solid var(--xjj-divider);border-radius:8px;padding:6px;display:flex;flex-direction:column;gap:4px;background:var(--xjj-control-bg-3)}',
      '.xjj-ed-line.on{border-color:var(--xjj-gold);box-shadow:0 0 0 1px rgba(217,164,65,.28);background:rgba(217,164,65,.08)}',
      '.xjj-ed-mods{display:flex;flex-wrap:wrap;gap:4px;min-width:0}',
      '.xjj-ed-mod{border:1px dashed var(--xjj-control-border-3);border-radius:5px;padding:3px 7px;font-size:11px;color:var(--xjj-text-2);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.xjj-ed-mod.on{border-style:solid;border-color:var(--xjj-gold-text);background:rgba(217,164,65,.18);color:var(--xjj-text-strong)}',
      '.xjj-ed-box{border:0;border-left:2px solid var(--xjj-control-border-4);border-radius:0;padding:4px 0 4px 8px;display:flex;flex-direction:column;gap:5px;background:transparent}',
      '.xjj-ed-in{background:var(--xjj-control-bg-2);border:1px solid var(--xjj-control-border-3);border-radius:6px;color:var(--xjj-text);font-size:11px;padding:3px 6px;font-family:inherit;outline:none;min-width:0;width:100%;box-sizing:border-box}',
      '.xjj-ed-in:focus{border-color:var(--xjj-gold)}',
      '.xjj-ed-in::placeholder,.xjj-ed-ta::placeholder{color:var(--xjj-muted);opacity:1}',
      '.xjj-ed-ta{width:100%;box-sizing:border-box;min-height:52px;resize:vertical;background:var(--xjj-control-bg-2);border:1px solid var(--xjj-control-border-3);border-radius:6px;color:var(--xjj-text);font-size:11px;padding:4px 6px;font-family:inherit;outline:none}',
      '.xjj-chip{border:1px solid var(--xjj-control-border-3);background:var(--xjj-control-bg);color:var(--xjj-text-2);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit;flex:none}',
      '.xjj-chip:hover{background:var(--xjj-control-border-2)}',
      '.xjj-chip.on{background:linear-gradient(180deg,#E3C07A,#C79A46);color:#17202A;font-weight:700;border-color:transparent}',
      '.xjj-mini{border:1px solid var(--xjj-control-border-3);background:var(--xjj-control-border);color:var(--xjj-text-2);border-radius:5px;font-size:11px;padding:3px 8px;cursor:pointer;font-family:inherit;flex:none}',
      '.xjj-mini:hover{background:var(--xjj-control-bg-hover)}',
      '.xjj-mini.danger{color:var(--xjj-red-strong);border-color:var(--xjj-red-strong);background:var(--xjj-control-bg)}',
      '.xjj-head-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--xjj-green);box-shadow:0 0 6px rgba(90,214,160,.6)}',
      '.xjj-head-dot.is-yellow{background:var(--xjj-yellow);box-shadow:0 0 8px rgba(240,190,70,.65)}',
      '.xjj-head-dot.is-low{background:var(--xjj-red);box-shadow:0 0 8px rgba(255,70,70,.6)}',
      '.xjj-head-dot.is-critical{background:var(--xjj-red);animation:xjj-crit 1.15s ease-in-out infinite}',
      '.xjj-head-about{border:0;background:none;color:var(--xjj-muted);font-size:11px;padding:2px 0;cursor:pointer;font-family:inherit;letter-spacing:.5px;flex:none;line-height:1}',
      '.xjj-head-about:hover{color:var(--xjj-gold)}',
      '.xjj-about{width:min(420px,calc(100vw - 28px))}',
      '.xjj-ab-body{gap:6px}',
      '.xjj-ab-sub{font-size:12px;color:var(--xjj-muted);letter-spacing:.3px}',
      '.xjj-ab-lead{font-size:14px;line-height:1.6;color:var(--xjj-text);margin:2px 0 4px}',
      '.xjj-ab-sec{font-size:12px;color:var(--xjj-gold-text);letter-spacing:1px;margin-top:8px}',
      '.xjj-ab-row{display:grid;grid-template-columns:1.7em 4.4em 1fr;gap:5px;font-size:12px;line-height:1.55;color:var(--xjj-text-2)}',
      '.xjj-root.is-en .xjj-ab-row{grid-template-columns:1.7em 5.8em 1fr}',
      '.xjj-ab-row.no-key{grid-template-columns:1.7em 1fr}',
      '.xjj-root.is-en .xjj-ab-row.no-key{grid-template-columns:1.7em 1fr}',
      '.xjj-ab-no{color:var(--xjj-gold-text);font-variant-numeric:tabular-nums}',
      '.xjj-ab-key{color:var(--xjj-text)}',
      '.xjj-ab-sub2{color:var(--xjj-text-2)}',
      '.xjj-ab-fine{font-size:12px;color:var(--xjj-muted);line-height:1.5;margin-top:6px}',
      '.xjj-ab-donate{margin-top:8px;padding-top:10px;border-top:1px solid var(--xjj-divider);display:flex;flex-direction:column;align-items:center;gap:6px}',
      '.xjj-ab-qr{width:200px;height:200px;border-radius:10px;background:#fff;padding:6px;box-sizing:border-box}',
      '.xjj-ab-ask{font-size:12.5px;color:var(--xjj-gold-text);font-weight:600}',
      '.xjj-root.is-en .xjj-ed-head span{letter-spacing:0}',
      '.xjj-sw{width:40px;height:24px;border-radius:12px;border:1px solid var(--xjj-control-border-4);background:var(--xjj-control-border-2);position:relative;cursor:pointer;padding:0;flex:none}',
      '.xjj-sw i{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#93A0A8;transition:all .15s}',
      '.xjj-sw.on{background:linear-gradient(180deg,#E3C07A,#C79A46);border-color:transparent}',
      '.xjj-sw.on i{left:21px;background:#1A1E22}',
      '.xjj-step{display:flex;align-items:center;gap:6px;flex:none}',
      '.xjj-step button{width:26px;height:26px;border-radius:6px;border:1px solid var(--xjj-control-border-3);background:var(--xjj-control-border);color:var(--xjj-text);font-size:13px;line-height:1;cursor:pointer;padding:0}',
      '.xjj-step button:hover{background:var(--xjj-control-bg-hover)}',
      '.xjj-step b{min-width:46px;text-align:center;font-size:12px;color:var(--xjj-gold-text);font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-stage.is-flying{will-change:transform;z-index:3}',
      '.xjj-stage.is-flying .xjj-sprite{animation:none;filter:drop-shadow(0 0 22px rgba(var(--xjj-glow-rgb),var(--xjj-glow-a,.65))) brightness(1.06)}',
      '.xjj-btn{border:1px solid var(--xjj-control-border-3);background:var(--xjj-control-border);color:var(--xjj-text);border-radius:8px;font-size:11.5px;padding:5px 10px;cursor:pointer;font-family:inherit;flex:none}',
      '.xjj-btn:hover{background:var(--xjj-control-bg-hover)}',
      '.xjj-range{width:108px;accent-color:var(--xjj-gold);flex:none}',
      '.xjj-c{position:absolute;width:12px;height:12px;border:2px solid rgba(240,206,134,.95);border-radius:1px;filter:drop-shadow(0 0 4px rgba(217,164,65,.45));pointer-events:none;z-index:2;display:none}',
      '.xjj-c-tl{left:3px;top:3px;border-right:0;border-bottom:0;border-top-left-radius:7px}',
      '.xjj-c-tr{right:3px;top:3px;border-left:0;border-bottom:0;border-top-right-radius:7px}',
      '.xjj-c-bl{left:3px;bottom:3px;border-right:0;border-top:0;border-bottom-left-radius:7px}',
      '.xjj-c-br{right:3px;bottom:3px;border-left:0;border-top:0;border-bottom-right-radius:7px}',
      '.xjj-corners{position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Cg fill=%22none%22 stroke=%22%23D9A441%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 opacity=%220.9%22%3E%3Cpath d=%22M2 18V8c0-3 2-5 5-5h8%22/%3E%3Cpath d=%22M6 14V10c0-2 1.5-3.5 3.5-3.5h3%22/%3E%3Ccircle cx=%226.5%22 cy=%226.5%22 r=%221.6%22/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Cg fill=%22none%22 stroke=%22%23D9A441%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 opacity=%220.9%22%3E%3Cpath d=%22M2 18V8c0-3 2-5 5-5h8%22/%3E%3Cpath d=%22M6 14V10c0-2 1.5-3.5 3.5-3.5h3%22/%3E%3Ccircle cx=%226.5%22 cy=%226.5%22 r=%221.6%22/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Cg fill=%22none%22 stroke=%22%23D9A441%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 opacity=%220.9%22%3E%3Cpath d=%22M2 18V8c0-3 2-5 5-5h8%22/%3E%3Cpath d=%22M6 14V10c0-2 1.5-3.5 3.5-3.5h3%22/%3E%3Ccircle cx=%226.5%22 cy=%226.5%22 r=%221.6%22/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Cg fill=%22none%22 stroke=%22%23D9A441%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 opacity=%220.9%22%3E%3Cpath d=%22M2 18V8c0-3 2-5 5-5h8%22/%3E%3Cpath d=%22M6 14V10c0-2 1.5-3.5 3.5-3.5h3%22/%3E%3Ccircle cx=%226.5%22 cy=%226.5%22 r=%221.6%22/%3E%3C/g%3E%3C/svg%3E");background-repeat:no-repeat;background-size:18px 18px;background-position:3px 3px,calc(100% - 3px) 3px,3px calc(100% - 3px),calc(100% - 3px) calc(100% - 3px)}',
      '.xjj-bubble.is-left{right:auto;left:100%;margin-right:0;margin-left:12px}',
      '.xjj-root.is-left .xjj-panel{right:auto;left:0}',
      '.xjj-root.is-left .xjj-gear{right:auto;left:20px}',
      '.xjj-tals-wrap{padding:7px 6px;border-radius:7px}',
      '.xjj-tals-wrap:hover{background:rgba(217,164,65,.06)}',
      '.xjj-tals{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 4px}',
      '.xjj-talpick{width:34px;height:34px;padding:2px;border-radius:8px;border:1px solid rgba(217,164,65,.28);background:var(--xjj-control-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}',
      '.xjj-talpick img{width:28px;height:28px;object-fit:contain;pointer-events:none}',
      '.xjj-talpick:hover{border-color:rgba(240,206,134,.85);background:rgba(217,164,65,.16)}',
      '.xjj-talpick.on{border-color:var(--xjj-gold-text);background:rgba(217,164,65,.24);box-shadow:0 0 8px rgba(217,164,65,.35) inset}',
      '.xjj-tals-name{font-size:11px;color:var(--xjj-text-2);opacity:1;font-family:"Microsoft YaHei",sans-serif}',
      '.xjj-tal-apply{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.xjj-talpick.pending{border-color:rgba(240,206,134,.95);box-shadow:0 0 0 2px rgba(240,206,134,.35)}',
      '.xjj-btn.dim{color:var(--xjj-muted);border-color:var(--xjj-control-border-2);background:transparent;pointer-events:none}',
      '.xjj-panel::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background:none}',
      '.xjj-panel > *{position:relative;z-index:1}',
      '.xjj-head b::before{content:"◇ ";color:rgba(240,206,134,.75);font-size:11px}',
      '.xjj-head b::after{content:" ◇";color:rgba(255,255,255,.28);font-size:11px;font-weight:400}',
      '.xjj-bubble::after{content:"";position:absolute;right:-8px;bottom:26%;width:16px;height:16px;background:var(--xjj-bubble-bg,#0a1015);border-right:1px solid rgba(217,164,65,.6);border-bottom:1px solid rgba(217,164,65,.6);transform:rotate(-45deg);border-bottom-right-radius:3px}',
      '.xjj-bubble.is-left::after{right:auto;left:-8px;transform:rotate(135deg);border-right-color:rgba(217,164,65,.6)}',
      '.xjj-root.is-left .xjj-bubble::after{right:auto;left:-8px;transform:rotate(135deg)}',
      '.xjj-bubble .xjj-corners::before{content:"";position:absolute;left:10px;right:10px;top:-7px;height:8px;border-radius:4px;background:linear-gradient(180deg,#B4614A,#7C3128 55%,#5D211A);box-shadow:inset 0 1px 0 rgba(255,214,180,.45),0 1px 3px rgba(0,0,0,.45)}',
      '.xjj-root *{-webkit-user-drag:none;user-drag:none}',
      '.xjj-root img{user-select:none}',
      '.xjj-bubble,.xjj-bubble *,.xjj-panel .xjj-tals-name,.xjj-panel .xjj-rowmain small{user-select:text!important;-webkit-user-select:text!important;cursor:text}',
      '@media (max-width:820px){.xjj-root{width:132px;height:200px;right:10px;bottom:8px}}',
    ].join('');


    // 菜单栏金额配色：≥50 绿 · 20–50 黄 · <20 红 · 低于告急阈值 呼吸鲜红
    const HEAD_GREEN_AT = 50;
    const HEAD_YELLOW_AT = 20;

    function amountTier(v, warnLow) {
      if (v === null || v === undefined || !Number.isFinite(Number(v))) return '';
      const n = Number(v);
      const low = Number.isFinite(Number(warnLow)) ? Number(warnLow) : 10;
      if (n < low) return 'is-critical';
      if (n < HEAD_YELLOW_AT) return 'is-low';
      if (n < HEAD_GREEN_AT) return 'is-yellow';
      return 'is-green';
    }

    function money(v) {
      if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
      const n = Number(v);
      return (n < 0 ? '-¥' : '¥') + Math.abs(n).toFixed(2);
    }

    function money3(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return '—';
      return (n < 0 ? '-¥' : '¥') + Math.abs(n).toFixed(Math.abs(n) < 0.1 ? 3 : 2);
    }

    function fmtCd(ms) {
      const total = Math.max(0, Math.round(Number(ms) / 1000));
      const hh = Math.floor(total / 3600);
      const mm = Math.floor((total % 3600) / 60);
      const ss = total % 60;
      const pad = (n) => String(n).padStart(2, '0');
      return hh > 0 ? hh + ':' + pad(mm) + ':' + pad(ss) : pad(mm) + ':' + pad(ss);
    }

    // 账本页用：token 缩写、模型名缩写（deepseek-v4-flash → v4-flash）
    function fmtTokens(v) {
      const n = Number(v) || 0;
      if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
      if (n >= 1e3) return Math.round(n / 1e3) + 'k';
      return String(n);
    }

    // 气泡编辑器用：模块类型表、新建模块、模块摘要（行内最多 6 模块 / 泡泡最多 6 行）
    const MOD_TYPES = [['text', '文本'], ['balance', '余额'], ['today', '今日'], ['peak', '峰谷'], ['random', '随机'], ['image', '图片']];
    const MAX_MODS = 6;
    const MAX_LINES = 6;

    function newModule(type) {
      if (type === 'balance') return { type: 'balance', fmt: '余额 ¥{v}' };
      if (type === 'today') return { type: 'today', fmt: '今日 {today}' };
      if (type === 'peak') return { type: 'peak', fmt: '{label} · {cd}' };
      if (type === 'random') return { type: 'random', items: [{ text: '新的一句', weight: 1 }] };
      if (type === 'image') return { type: 'image', src: '', height: 80 };
      return { type: 'text', text: '新模块' };
    }

    function modSummary(m) {
      if (!m || typeof m !== 'object') return '—';
      if (m.type === 'text') return String(m.text || '').slice(0, 14) || '（空）';
      if (m.type === 'random') return '随机 ' + (Array.isArray(m.items) ? m.items.length : 0) + ' 句';
      if (m.type === 'image') return '图片';
      return String(m.type || '') + (m.fmt ? ' ' + String(m.fmt).slice(0, 8) : '');
    }

    // 模型 id → 显示名（账本/气泡里给人看的名字；API 仍用 id）
    const MODEL_LABEL = {
      'deepseek-flash': 'DS-V4.1-Flash',
      'deepseek-v4-flash': 'DS-V4.1-Flash',
      'deepseek-v4-flash-vision-exp': 'DS-V4.1-Flash',
      'deepseek-pro': 'DS-V4.1-Pro',
      'deepseek-v4-pro': 'DS-V4.1-Pro',
    };
    function modelLabel(id) {
      const k = String(id || '').trim().toLowerCase();
      return MODEL_LABEL[k] || String(id || '');
    }

    function shortModel(v) {
      const s = String(v || '').replace(/^deepseek[-_]?/i, '').replace(/-vision-exp$/i, '');
      return s.length > 16 ? s.slice(0, 16) + '…' : s;
    }

    // —— 气泡可读性：字号下限 + 压暗的颜色提亮（2026-10-26：字太小、颜色不够亮）——
    // 只改渲染不动配置：存下来的 11px / #93A3AB 照样留着，界面上按底线显示。
    const MIN_BUBBLE_FONT = 14;
    const MIN_TEXT_LUM = 0.82;

    function parseColor(c) {
      const s = String(c || '').trim();
      let m = /^#([0-9a-f]{3})$/i.exec(s);
      if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
      m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
      if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      m = /^rgba?\(([^)]+)\)$/i.exec(s);
      if (m) {
        const p = m[1].split(',').map((x) => parseFloat(x));
        if (p.length >= 3 && p.slice(0, 3).every((x) => Number.isFinite(x))) return p.slice(0, 3);
      }
      return null;
    }

    function brightenColor(c, minLum) {
      const rgb = parseColor(c);
      if (!rgb) return c;
      const target = minLum === undefined ? MIN_TEXT_LUM : minLum;
      const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      if (lum >= target) return c;
      const k = Math.min(1, (target - lum) / Math.max(0.001, 1 - lum));
      const mix = (v) => Math.round(v + (255 - v) * k);
      const hex = (v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
      return '#' + hex(mix(rgb[0])) + hex(mix(rgb[1])) + hex(mix(rgb[2]));
    }

    function readableFont(v) {
      const n = Number(v);
      return Math.max(MIN_BUBBLE_FONT, Number.isFinite(n) && n > 0 ? n : MIN_BUBBLE_FONT);
    }

    function weightedPick(items, last) {
      const pool = (items || []).filter((i) => i && Number.isFinite(Number(i.weight)) && Number(i.weight) > 0);
      const list = pool.length ? pool : (items || []);
      if (!list.length) return null;
      if (list.length > 1 && last) {
        const again = weightedPick(list.filter((i) => i !== last), null);
        if (again) return again;
      }
      const total = list.reduce((s, i) => s + Math.max(0, Number(i.weight) || 1), 0);
      let r = Math.random() * total;
      for (const item of list) {
        r -= Math.max(0, Number(item.weight) || 1);
        if (r <= 0) return item;
      }
      return list[list.length - 1];
    }

    // 运行时翻译入口：__xjjT 由构建时的 i18n 预置脚本注入（中文原文当 key）。
    // 源码直跑 / 单测里没有它，就原样返回。
    function T(s) {
      try { return window.__xjjT ? window.__xjjT(s) : s } catch (err) { return s }
    }

    function fill(tpl, vars) {
      return String(T(tpl == null ? '' : tpl)).replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
    }

    function beijingHour() {
      return new Date(Date.now() + 8 * 3600 * 1000).getUTCHours();
    }

    // 过期文案迁移表：键 = 文案字段，值 = 需要被替换掉的旧句子列表（当前为空表，机制保留）
    const STALE_TEXTS = {};

    function mergeConfig(saved) {
      // 过期文案迁移：旧版本已被替换掉的固定句子，不再让保存值顶回去
            const scrubTexts = (o) => {
        Object.keys(STALE_TEXTS).forEach((k) => {
          if (o.texts && STALE_TEXTS[k].indexOf(String(o.texts[k] || '')) >= 0) o.texts[k] = DEFAULT_CONFIG.texts[k];
        });
        return o;
      };
      const out = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      if (!saved || typeof saved !== 'object') return out;
      // 老配置（v<4）的气泡配色/排版整份换新：墨底金线那一套
      const legacy = !saved.version || Number(saved.version) < 7;
      if (legacy) {
        out.sound = Object.assign(out.sound, saved.sound || {});
        out.warn = Object.assign(out.warn, saved.warn || {});
        out.chatter = Object.assign(out.chatter, saved.chatter || {});
        out.ui = Object.assign(out.ui, saved.ui || {});
        out.notice = Object.assign(out.notice, saved.notice || {});
        out.wellness = Object.assign(out.wellness, saved.wellness || {});
        if (typeof saved.bubbleOn === 'boolean') out.bubbleOn = saved.bubbleOn;
        if (Number(saved.bubbleHoldSec) > 0) out.bubbleHoldSec = Number(saved.bubbleHoldSec);
        out.texts = Object.assign(out.texts, saved.texts || {});
        // 2026-10-27 修：budget / lineLib 以前没合并，存得进去、读回来被默认值盖掉
        out.budget = Object.assign({}, out.budget, saved.budget || {});
        if (Array.isArray(saved.lineLib)) out.lineLib = saved.lineLib;
        return scrubTexts(out);
      }
      out.style = Object.assign(out.style, saved.style || {});
      out.sound = Object.assign(out.sound, saved.sound || {});
      out.warn = Object.assign(out.warn, saved.warn || {});
      out.chatter = Object.assign(out.chatter, saved.chatter || {});
      out.ui = Object.assign(out.ui, saved.ui || {});
      out.notice = Object.assign(out.notice, saved.notice || {});
      out.wellness = Object.assign(out.wellness, saved.wellness || {});
      if (typeof saved.bubbleOn === 'boolean') out.bubbleOn = saved.bubbleOn;
      if (Number(saved.bubbleHoldSec) > 0) out.bubbleHoldSec = Number(saved.bubbleHoldSec);
      out.texts = Object.assign(out.texts, saved.texts || {});
      // 2026-10-27 修：budget / lineLib 以前没合并，存得进去、读回来被默认值盖掉
      out.budget = Object.assign({}, out.budget, saved.budget || {});
      if (Array.isArray(saved.lineLib)) out.lineLib = saved.lineLib;
        scrubTexts(out);
      // 闲聊文案：旧版是纯字符串数组，整批换成新版（带姿态/音效/补句）
      if (Array.isArray(saved.idle) && saved.idle.length && saved.idle.some((x) => x && typeof x === 'object')) {
        out.idle = saved.idle;
      }
      if (saved.first && Array.isArray(saved.first.lines)) out.first = saved.first;
      if (Array.isArray(saved.queue) && saved.queue.length) {
        // 老配置没有 pose 字段：按 id 从默认预设补上，新增项也一并保留
        out.queue = saved.queue.filter((it) => !(it && ['dance'].indexOf(it.id) >= 0)).map((item) => {
          const def = DEFAULT_CONFIG.queue.find((d) => d.id === (item && item.id));
          if (!def) return item;
          const merged = Object.assign({}, def, item);
          if (!item.pose && def.pose) merged.pose = def.pose;
          if (!Array.isArray(item.variants) || !item.variants.length) merged.variants = def.variants;
          return merged;
        });
        // 默认队列里新增的条目（按 id 比对）补进来，保证升级后能看到新动作
        const haveIds = new Set(out.queue.map((it) => it && it.id));
        for (const def of DEFAULT_CONFIG.queue) {
          if (def && def.id && !haveIds.has(def.id)) out.queue.push(JSON.parse(JSON.stringify(def)));
        }
      }
      // v10 迁移（2026-10-26）：两张图对调了身份 —— `sword` 那张其实是擦剑、`wipe` 那张才是拔剑
      // （按核对图逐张校正）。旧配置里「剑来」挂在 sword、闲聊「剑要常擦」挂在 wipe，都指反了。
      // 只动"还停在旧默认值"的那两处，用户自己改过的不碰。
      if (Number(saved.version || 0) < 10) {
        out.queue = (out.queue || []).map((it) => {
          if (!it || it.id !== 'sword' || it.pose !== 'sword') return it;
          return Object.assign({}, it, { pose: 'wipe' });
        });
        out.idle = (out.idle || []).map((it) => {
          if (!it || typeof it !== 'object' || it.pose !== 'wipe') return it;
          if (String(it.text || '').indexOf('剑要常擦') < 0) return it;
          return Object.assign({}, it, { pose: 'sword' });
        });
      }
      return out;
    }

    function Widget(props) {
      const tr = props.tr || ((k, fb) => fb);
      const lang = props.lang === 'en' ? 'en' : 'zh';

      // 自测台的强制姿态钩子（verify/geometry.py 用 URL 参数 ?xjj_test_pose=xxx）。
      // 只在自测台（路径里有 /verify/）生效：真实页面就算被人拼上这个参数也拿不到，
      // 免得有人手滑给一个进程焊死某个姿态、连忙碌时的守炉都不跟。
      const TEST_POSE = (() => {
        try {
          if (typeof location === 'undefined') return '';
          if (!/\/verify\//.test(location.pathname || '')) return '';
          if (!location.search) return '';
          return new URLSearchParams(location.search).get('xjj_test_pose') || '';
        } catch (err) { return ''; }
      })();
      const [pose, setPoseState] = React.useState(TEST_POSE || 'idle');
      const [seq, setSeq] = React.useState(-1);
      const [hovering, setHovering] = React.useState(false);
      const [state, setState] = React.useState({ balance: null, todayUsed: 0, peak: {}, busy: false });
      const [cfg, setCfg] = React.useState(DEFAULT_CONFIG);
      // 主题 / 衣装 / 背光：一次算好（逻辑在模块级 readView，加新外观维度只改那里）
      const view = readView(cfg, props.scheme);
      const { themePref, isLight, outfitPref, useWhite, glowPref, glowAlpha, glowRgb } = view;
      const [special, setSpecial] = React.useState(null); // { lines, at }
      const [slash, setSlash] = React.useState(0);
      const picks = React.useRef({});
      const lastActive = React.useRef(Date.now());
      const timers = React.useRef([]);
      const audio = React.useRef({});
      const clickTimes = React.useRef([]);
      const reactGen = React.useRef(0);
      const rootRef = React.useRef(null);
      const menuRef = React.useRef(null);
      const drag = React.useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });
      const busyTouch = React.useRef(false);   // 拖动/长按进行中：禁止重算位置
      const [pos, setPos] = React.useState(null); // { x, y } 视口像素；null = 默认贴右下
      const [dragging, setDragging] = React.useState(false);
      const [menuOpen, setMenuOpen] = React.useState(false);
      // 宽姿态（打坐/守炉/剑舞）在屏幕右边缘会被裁：按当前姿态量一次，整体左移这么多
      const [spriteShift, setSpriteShift] = React.useState(0);
      const [menuTab, setMenuTab] = React.useState('data');
      const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
      const [panelAt, setPanelAt] = React.useState(null);   // 拖过之后的固定坐标 {x,y}
      const [pendingTal, setPendingTal] = React.useState(null);  // 法宝待应用
      const [dataBodyH, setDataBodyH] = React.useState(250);     // 「数据」页内容高度（作为基准）
      const bodyRef = React.useRef(null);
      const headRef = React.useRef(null);
      const tabsRef = React.useRef(null);
      const [chromeH, setChromeH] = React.useState(74);   // 标题栏 + 页签实测高度
      const [refreshState, setRefreshState] = React.useState('idle');
      const refreshTimers = React.useRef([]);
      const turnSeq = React.useRef(0);
      const waitSeen = React.useRef('');   // 上一次提醒过的挂起（kind:id）；'' = 当前没有挂起
      const cfgPathRef = React.useRef('');   // 宿主给的配置文件路径（网页版是 localStorage://…）
      const stageRef = React.useRef(null);   // 御剑飞行动画直接改 transform，不逐帧重渲染
      const gearRef = React.useRef(null);    // 法宝按钮：面板以它为锚点往上排（人物放大后按钮会升高）
      // 面板锚点（屏幕 y）：只在这个值变化时才重排面板。
      // 为什么不在 render 里直接量按钮：调「人物大小」时按钮会跟着头升降，
      // 面板若跟着动，鼠标下的「＋/－」会在点击之间跑掉 → 指针乱跳、误点到别的设置（2026-10-26 修）。
      const panelAnchor = React.useRef(0);
      const flightRef = React.useRef(0);     // requestAnimationFrame 句柄，0 = 没在飞
      const [flying, setFlying] = React.useState(false);
      const flyingRef = React.useRef(false);   // 飞行中禁止别的定时器改姿势
      const flightAt = React.useRef(0);        // 起飞时刻：连点第 5 下起飞后，第 6 下不许立刻把飞机打下来
      const [usage, setUsage] = React.useState(null);      // 账本页数据
      const [usageRange, setUsageRange] = React.useState('today');
      const [usageQ, setUsageQ] = React.useState('');
      const [editor, setEditor] = React.useState(null);    // 气泡编辑器草稿 {kind, qi, vi, title, lines}
      const [confirmReset, setConfirmReset] = React.useState(false);   // 「恢复默认」的二次确认条
      const [aboutOpen, setAboutOpen] = React.useState(false);        // 「关于」浮窗
      const [selLine, setSelLine] = React.useState(0);
      const [selMod, setSelMod] = React.useState(0);
      const lowAlerted = React.useRef(false);
      const errAlerted = React.useRef('');
      const lateShown = React.useRef(false);
      const seenBusy = React.useRef(false);

      const clearTimers = React.useCallback(() => {
        if (flightRef.current) { cancelAnimationFrame(flightRef.current); flightRef.current = 0; }
        timers.current.forEach((id) => clearTimeout(id));
        timers.current = [];
        refreshTimers.current.forEach((id) => clearTimeout(id));
        refreshTimers.current = [];
      }, []);
      const later = React.useCallback((fn, ms) => {
        const id = setTimeout(fn, ms);
        timers.current.push(id);
        // 长挂页面时定时器 id 会无限堆积：只保留最近 120 个（早已触发的丢掉无妨）
        if (timers.current.length > 240) timers.current = timers.current.slice(-120);
        return id;
      }, []);

      React.useEffect(() => clearTimers, [clearTimers]);

      const lowBalance = state.balance !== null && Number(state.balance) < Number((cfg.warn || {}).balanceLow || 0);
      const uiScale = Math.max(0.7, Math.min(1.6, Number((cfg.ui || {}).scale) || 1));
      const uiCfg = cfg.ui || {};
      const leftSide = String(uiCfg.anchor || 'br').endsWith('l') || !!(pos && pos.x < 240);
      const autoMirror = uiCfg.mirror !== false;   // 开关：贴左时是否自动镜像（默认开）
      const mirror = autoMirror && leftSide;
      const talisman = String(uiCfg.talisman || 'seal');

      // 硬守卫：飞行期间只允许 'fly'，其它一律拦下 —— 层里任何一处漏判 flyingRef 也破不了相
      const setPose = React.useCallback((next) => {
        if (flyingRef.current) {
          const n = typeof next === 'function' ? next('fly') : next;
          if (n !== 'fly') return;
        }
        setPoseState(next);
      }, []);
      const basePose = React.useCallback(() => {
        if (state.busy) return 'forge';
        if (hovering) return lowBalance ? 'poor' : 'greet';
        return 'idle';
      }, [hovering, lowBalance, state.busy]);

      // 反应动作：同一时刻只有一个反应，旧定时器不许盖掉新的
      const react = React.useCallback((nextPose, ms) => {
        if (flyingRef.current && nextPose !== 'fly') return;   // 飞行中不许被闲聊/劝睡抢姿势
        const gen = reactGen.current + 1;
        reactGen.current = gen;
        if (nextPose !== pv.current.pose) playSfx('cloth');
        setPose(nextPose);
        // 拖动期间不许自动收势：手还按着，姿势该跟着人走（御剑拖完再落地）
        later(() => { if (reactGen.current === gen && !drag.current.active && !flyingRef.current) setPose(basePose()); }, ms);
      }, [basePose, later]);

      const playSfx = React.useCallback((name) => {
        const snd = cfg.sound || {};
        if (snd.on === false) return;
        if (name !== 'turn' && snd[name] === false) return;
        if (name === 'turn' && snd.turn === false) return;
        try {
          let a = audio.current[name];
          if (!a) {
            a = new Audio(SFX[name]);
            audio.current[name] = a;
          }
          a.volume = Math.max(0, Math.min(1, Number(snd.volume === undefined ? 0.5 : snd.volume)));
          a.currentTime = 0;
          const p = a.play();
          if (p && p.catch) p.catch(() => {});
        } catch (err) { /* 静默：没有 Audio 也能用 */ }
      }, [cfg.sound]);

      // ── 御剑飞行：从当前位置起飞 → 绕屏幕中心飞 1.35 圈 → 飞回原位 ────────────
      // 为什么用 rAF 改 transform 而不是 React state：每帧重渲染整个挂件太贵；
      // 这里只动 stage 的 style.transform，起停各一次 setState 就够了。
      const stopFlight = React.useCallback((restorePose) => {
        if (flightRef.current) {
          cancelAnimationFrame(flightRef.current);
          flightRef.current = 0;
        }
        flyingRef.current = false;
        setFlying(false);
        if (stageRef.current) {
          stageRef.current.style.transform = '';
          stageRef.current.style.animation = '';   // 归还给 CSS 的浮动动画
        }
        if (restorePose) setPose(basePose());
      }, [basePose]);

      const startFlight = React.useCallback(() => {
        if (flightRef.current || drag.current.active) return;   // 正在飞 / 正在拖：不重复起飞
        const el = rootRef.current;
        const st0 = stageRef.current;
        if (!el || !st0) return;
        const W = window.innerWidth;
        const H = window.innerHeight;
        // 路径要按「立绘的真实屏幕矩形」算：人物放大后它比 root 盒子高得多（1.6× 时 432px vs 270px），
        // 拿 root 盒子算半径就会让头顶飞出屏幕（2026-10-26 修）
        // 用「御剑那一张」量尺寸：它比站姿宽得多（剑横着），用站姿量会算窄 → 巡航时出屏
        const visEl = st0.querySelector('.xjj-sprite[data-pose="fly"]') || st0.querySelector('.xjj-sprite.is-on') || st0;
        const vis = visEl.getBoundingClientRect();
        const vw = vis.width;
        const vh = vis.height;
        const cx = W / 2;
        const cy = H * 0.45;
        // 视觉中心绕 (cx, cy) 转：留出半个立绘再加 12px 边距，才保证不越界
        // 飞行中带 ±7° 倾角，旋转会把包围盒撑大：竖向多算 (宽/2)·sin7°，横向多算 (高/2)·sin7°
        const tiltRad = 7 * Math.PI / 180;
        // 旋转原点在立绘底部中心：顶端离原点整整一个 vh，7° 就会横向甩出 sin7°×vh（不是半个）
        const padX = 20 + Math.sin(tiltRad) * vh;
        const padY = 20 + Math.sin(tiltRad) * vw / 2;
        const maxRx = Math.min(cx, W - cx) - vw / 2 - padX;
        const maxRy = Math.min(cy, H - cy) - vh / 2 - padY;
        const rx = Math.max(60, Math.min(W * 0.34, 520, maxRx));
        const ry = Math.max(50, Math.min(H * 0.28, 300, maxRy));
        // 起点：立绘中心的当前屏幕坐标（不是 root 的左上角）
        const sx = vis.left + vw / 2;
        const sy = vis.top + vh / 2;
        const a0 = Math.atan2((sy - cy) / ry, (sx - cx) / rx);
        const loops = 1.35;
        const span = 6000;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const point = (u) => {
          if (u < 0.1) {                                   // 起飞：从原地插到椭圆上
            const k = ease(u / 0.1);
            const tx = cx + Math.cos(a0) * rx;
            const ty = cy + Math.sin(a0) * ry;
            return [sx + (tx - sx) * k, sy + (ty - sy) * k];
          }
          if (u > 0.9) {                                   // 回位：从椭圆插回原地
            const k = ease((u - 0.9) / 0.1);
            const ang = a0 + Math.PI * 2 * loops;
            const fx = cx + Math.cos(ang) * rx;
            const fy = cy + Math.sin(ang) * ry;
            return [fx + (sx - fx) * k, fy + (sy - fy) * k];
          }
          const ang = a0 + ((u - 0.1) / 0.8) * Math.PI * 2 * loops;   // 巡航
          return [cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry];
        };
        flyingRef.current = true;
        flightAt.current = Date.now();   // 起飞时刻（onClick 用它挡掉「第 6 下立刻落地」）
        setFlying(true);
        // 起飞第一帧就换成御剑姿势：之前为了防剑尖戳出屏幕延迟了 600ms，
        // 看起来就是「飞了但人还保持上一个动作」。越界交给每帧的实测夹取处理。
        setPose('fly');
        playSfx('wind');
        // 朝向：往左飞就把人翻一面，不然是"倒着（背朝前）飞"
        // 2026-10-27 修：这里**不能再乘 mirror**。贴左时 mirror=-1 已经把图翻成朝左，
        // 再乘 facing 就变成「向右飞却朝左」，正是贴左飞行姿势不对的原因。
        // 飞行中的朝向只由运动方向（facing）决定，跟静止时的镜像无关。
        const baseScaleX = uiScale;
        let facing = 1;
        const tick = (now) => {
          const u = Math.min(1, (now - t0) / span);
          const [x, y] = point(u);
          const st = stageRef.current;
          if (st) {
            // 起降两段不倾斜：那时人还在屏幕角落，7° 旋转会让边角戳出去 3–5px
            const ramp = Math.min(1, Math.max(0, (u - 0.08) / 0.04)) * Math.min(1, Math.max(0, (0.92 - u) / 0.04));
            const tilt = Math.sin(u * Math.PI * 2 * loops) * 7 * ramp;
            const nx = point(Math.min(1, u + 0.004))[0];
            if (Math.abs(nx - x) > 0.8) facing = nx < x ? -1 : 1;   // 死区：接近垂直运动时不翻
            let dx = x - sx;
            let dy = y - sy;
            const write = () => {
              st.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + tilt.toFixed(1)
                + 'deg) scale(' + (baseScaleX * facing) + ', ' + uiScale + ')';
            };
            write();
            // 视觉兜底：不论姿态多宽、倾角多大，都把真实矩形夹回屏幕（2026-10-26）
            const box = st.getBoundingClientRect();
            let fixX = 0;
            let fixY = 0;
            if (box.right > W) fixX = W - box.right;
            else if (box.left < 0) fixX = -box.left;
            if (box.bottom > H) fixY = H - box.bottom;
            else if (box.top < 0) fixY = -box.top;
            if (fixX || fixY) {
              dx += fixX;
              dy += fixY;
              write();
            }
          }
          if (u >= 1) {
            flightRef.current = 0;
            flyingRef.current = false;
            setFlying(false);
            if (st) { st.style.transform = ''; st.style.animation = ''; }
            playSfx('bell');
            setPose(basePose());
            return;
          }
          flightRef.current = requestAnimationFrame(tick);
        };
        flightRef.current = requestAnimationFrame(tick);
      }, [basePose, mirror, playSfx, uiScale]);

      const specialGen = React.useRef(0);
      const showSpecial = React.useCallback((lines, ms, poseName, sfxName) => {
        const gen = specialGen.current + 1;
        specialGen.current = gen;
        setSpecial({ lines: lines, at: Date.now() });
        playSfx(sfxName || 'bubble');
        if (poseName) react(poseName, Math.min(ms || 6000, 2800));
        // 只让「最后一个」气泡的定时器负责收起，旧定时器不能清掉新气泡
        later(() => { if (specialGen.current === gen) setSpecial(null); }, ms || 6000);
      }, [later, react, playSfx]);

      // 状态：60 秒
      React.useEffect(() => {
        let cancelled = false;
        const load = async (force) => {
          try {
            const res = await fetch('/xjj/state.json' + (force ? '?refresh=1' : ''), { credentials: 'same-origin' });
            const data = await res.json();
            if (!cancelled && data && data.ok) setState(data);
          } catch (err) { /* 下次再试 */ }
        };
        load(false);
        const id = setInterval(() => load(false), 60000);
        return () => { cancelled = true; clearInterval(id); };
      }, []);

      // 配置
      React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
          try {
            const res = await fetch('/xjj/config.json', { credentials: 'same-origin' });
            const data = await res.json();
            if (data && data.path) cfgPathRef.current = String(data.path);
            if (cancelled || !data || !data.ok) return;
            if (data.config && Array.isArray(data.config.queue)) {
              const merged = mergeConfig(data.config);
              setCfg(merged);
              // version 回写：老配置迁移完把版本号存回去，避免每次启动都重跑迁移（自定义文案不会被反复冲掉）
              if (Number(data.config.version || 0) !== Number(merged.version)) {
                saveConfig(merged);
              }
              return;
            }
            await saveConfig(DEFAULT_CONFIG);
          } catch (err) { /* 用内置默认值 */ }
        };
        load();
        return () => { cancelled = true; };
      }, []);

      async function saveConfig(next) {
        try {
          await fetch('/xjj/config.json', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-xjj-write': '1' },
            credentials: 'same-origin',
            body: JSON.stringify(next),
          });
        } catch (err) { /* 写不进去就先用内存里的 */ }
      }

      // 每轮消耗：3 秒轮询，seq 变大就冒一次
      React.useEffect(() => {
        if ((cfg.notice || {}).turnCost === false) return undefined;
        let cancelled = false;
        const load = async () => {
          try {
            const res = await fetch('/xjj/turn.json', { credentials: 'same-origin' });
            const d = await res.json();
            if (cancelled || !d || !d.ok) return;
            if (typeof d.seq === 'number' && d.seq > turnSeq.current) {
              // 只有「页面刚开、服务端已经攒了不止一轮」才只对齐不播；本插件启用后的第一轮照常冒泡
              const first = turnSeq.current === 0 && d.seq > 1;
              turnSeq.current = d.seq;
              if (first) return; // 页面重开后先对齐基线，不补播历史泡泡
              const texts = cfg.texts || {};
              const model = String(d.model || '');
              // amount === null = 这一轮没计价（模型不在价格表，或走的是第三方路由）。
              // 这时候不能显示 ¥0.00 —— 0 会被读成"这轮免费"，而真相是"我们不知道"。
              const unpriced = d.amount === null || d.amount === undefined;
              const lines = [
                // 三行：标题+金额 / token / 模型名（模型行加粗，用全名）
                {
                  style: { fontSize: 14, fontWeight: 700 },
                  modules: [
                    { type: 'text', text: (texts.turnTitle || '本轮消耗') + '：', style: { fontSize: 14, color:'var(--xjj-bub-gold)', fontWeight: 600 } },
                    { type: 'text', text: unpriced ? '未计价' : money3(d.amount), style: { fontSize: 12, color: unpriced ? '#C9B98F' : '#9FE7F5', fontWeight: 700, noFloor: true } },
                  ],
                },
                {
                  style: { marginTop: 2, fontSize: 12, color:'var(--xjj-bub-dim)', noFloor: true },
                  modules: [{ type: 'text', text: Number(d.tokens || 0).toLocaleString('en-US') + ' tok' }],
                },
                model ? {
                  style: { marginTop: 1, fontSize: 12, color:'var(--xjj-bub-dim)', fontWeight: 700, noFloor: true },
                  modules: [{ type: 'text', text: modelLabel(model) }],
                } : null,
                unpriced ? {
                  style: { marginTop: 1, fontSize: 11, color:'var(--xjj-bub-dim)', noFloor: true },
                  modules: [{ type: 'text', text: '（不在价格表或非官方路由，只记 token）' }],
                } : null,
              ].filter(Boolean);   // model 为空时第三行是 null，过滤掉再渲染
              showSpecial(lines, 8000, 'ledger');
              playSfx('turn');
            }
          } catch (err) { /* 静默 */ }
        };
        load();
        const id = setInterval(load, 3000);
        return () => { cancelled = true; clearInterval(id); };
      }, [basePose, cfg.notice, cfg.texts, later, playSfx, showSpecial]);

      // 提问 / 授权：DSH 在等你答话或点头时提醒一次（同一件挂起只吵一次；3 秒轮询，比 1 秒省）
      React.useEffect(() => {
        const notice = cfg.notice || {};
        if (notice.askWait === false && notice.approveWait === false) return undefined;
        let cancelled = false;
        const load = async () => {
          try {
            const res = await fetch('/xjj/wait.json', { credentials: 'same-origin' });
            const d = await res.json();
            if (cancelled || !d || !d.ok) return;
            const p = d.pending || null;
            const seen = p ? String(p.kind) + ':' + String(p.id) : '';
            if (seen === waitSeen.current) return;
            waitSeen.current = seen;
            if (!p) return;
            const n = cfg.notice || {};
            if (p.kind === 'question' && n.askWait === false) return;
            if (p.kind === 'approval' && n.approveWait === false) return;
            const texts = cfg.texts || {};
            const who = String(d.sessionName || '').trim().slice(0, 12) || '当前对话';
            const isQuestion = p.kind === 'question';
            const raw = isQuestion
              ? (texts.waitAsk || '东家，{session}在等你答话。')
              : (texts.waitApprove || '有件事要你点头（{session}）。');
            const body = String(raw).split('{session}').join(who);
            // 提问/授权提醒是"要你做决定"的泡泡，字号和颜色都要比普通闲聊重一档：
            // 标题金黄加粗、正文纯白加粗 17px（这条原来字小、不够亮）
            showSpecial([
              { style: { fontSize: 15, fontWeight: 700, letterSpacing: 2, color:'var(--xjj-bub-cyan)', textShadow: isLight ? 'none' : '0 0 10px rgba(123,234,255,.55)' }, modules: [{ type: 'text', text: isQuestion ? '等你答话' : '等你点头' }] },
              { style: { marginTop: 4, fontSize: 14, fontWeight: 700, color:'var(--xjj-bub-gold)', letterSpacing: .3, textShadow: isLight ? 'none' : '0 0 8px rgba(255,194,71,.35),0 1px 2px rgba(0,0,0,.6)' }, modules: [{ type: 'text', text: body }] },
            ], 20000, isQuestion ? 'chin' : 'greet', 'alert');
          } catch (err) { /* 静默 */ }
        };
        load();
        const id = setInterval(load, 3000);
        return () => { cancelled = true; clearInterval(id); };
      }, [cfg.notice, cfg.texts, playSfx, showSpecial]);

      // 今日预算：当天已用达到预算就冒一次泡（每天只提醒一次，用 localStorage 记日期）
      React.useEffect(() => {
        const cap = Number((cfg.budget || {}).daily) || 0;
        const used = Number(state.todayUsed) || 0;
        if (!cap || used < cap) return undefined;
        const key = 'xjj-budget-' + String(state.day || '');
        try { if (window.localStorage.getItem(key)) return undefined; } catch (err) {}
        try { window.localStorage.setItem(key, '1'); } catch (err) {}
        const tpl = String((cfg.texts || {}).budget || '今天已经用掉 {v}，到预算 {cap} 了。');
        const body = tpl.split('{v}').join(money(used)).split('{cap}').join(money(cap));
        showSpecial([
          { style: { fontSize: 11, letterSpacing: 3, color:'var(--xjj-bub-text)' }, modules: [{ type: 'text', text: '今 日 预 算' }] },
          { style: { marginTop: 3, fontSize: 12.5, color:'var(--xjj-bub-text)' }, modules: [{ type: 'text', text: body }] },
        ], 12000, 'coins', 'alert');
        return undefined;
      }, [cfg.budget, cfg.texts, state.todayUsed, state.day, showSpecial]);

      // 账本页：切页 / 切档 / 搜索时拉一次（搜索 300ms 防抖，别每敲一个字打一次宿主）
      React.useEffect(() => {
        if (menuTab !== 'ledger') return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
          try {
            const url = '/xjj/usage.json?range=' + encodeURIComponent(usageRange) + '&q=' + encodeURIComponent(usageQ);
            const res = await fetch(url, { credentials: 'same-origin' });
            const d = await res.json();
            if (!cancelled && d && d.ok) setUsage(d);
          } catch (err) { /* 静默 */ }
        }, usageQ ? 300 : 0);
        return () => { cancelled = true; clearTimeout(timer); };
      }, [menuTab, usageRange, usageQ]);

      // 打盹：60 秒没动且没泡泡 → 抱剑靠坐打瞌睡；深夜则直接钻被窝
      React.useEffect(() => {
        const id = setInterval(() => {
          if (flyingRef.current) return;   // 飞着呢，别让它打盹
          const idleMin = (Date.now() - lastActive.current) / 60000;
      if (idleMin > 3 && seq < 0 && !special && pose !== 'doze') { setPose('doze'); return; }
      if (Date.now() - lastActive.current > 60000 && seq < 0 && !special) {
            const h = beijingHour();
            setPose(h >= 23 || h < 6 ? 'sleep' : 'doze');
          }
        }, 5000);
        return () => clearInterval(id);
      }, [seq, special]);

      // 峰谷倒计时
      React.useEffect(() => {
        const id = setInterval(() => {
          setState((prev) => {
            const peak = prev.peak || {};
            if (typeof peak.nextInMs !== 'number') return prev;
            return Object.assign({}, prev, { peak: Object.assign({}, peak, { nextInMs: Math.max(0, peak.nextInMs - 1000) }) });
          });
        }, 1000);
        return () => clearInterval(id);
      }, []);

      // 深夜劝睡（23:30–06:00）：每晚一次
      React.useEffect(() => {
        if ((cfg.notice || {}).lateNight === false) return undefined;
        const check = () => {
          const hour = beijingHour();
          const late = hour >= 23 || hour < 6;
          if (!late || lateShown.current) return;
          lateShown.current = true;
          const key = 'xjj:lateShown:' + new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
          try {
            if (window.localStorage.getItem(key)) return;
            window.localStorage.setItem(key, '1');
          } catch (err) { /* 无痕模式也能跑 */ }
          playSfx('bell');
          showSpecial([{ style: { fontSize: 13, fontWeight: 700, color:'var(--xjj-bub-cyan)' }, modules: [{ type: 'text', text: (cfg.texts || {}).lateNight || '子时了。剑也该归鞘，你也该睡了。' }] }], 9000, 'yawn');
        };
        check();
        // 页面开着跨过 23:00 也要能触发，不能只在挂载时判一次
        const id = setInterval(check, 60 * 1000);
        return () => clearInterval(id);
      }, [cfg.notice, cfg.texts, showSpecial, playSfx]);

      // 余额跌破提醒：每天一次
      React.useEffect(() => {
        if ((cfg.notice || {}).lowBalance === false) return;
        if (lowBalance && !lowAlerted.current) {
          lowAlerted.current = true;
          const key = 'xjj:lowAlert:' + (state.day || '');
          try {
            if (window.localStorage.getItem(key)) return;
            window.localStorage.setItem(key, '1');
          } catch (err) { /* ignore */ }
          playSfx('alert');
          showSpecial([
            { style: { fontSize: 13, fontWeight: 700, color:'var(--xjj-bub-cyan)' }, modules: [{ type: 'text', text: '灵石告急' }] },
            { style: { marginTop: 2 }, modules: [{ type: 'text', text: fill((cfg.texts || {}).lowBalance || '灵石不多了（{v}），省着点用。', { v: money(state.balance) }) }] },
          ], 9000, 'coins');
        }
        if (!lowBalance) lowAlerted.current = false;
      }, [cfg.notice, cfg.texts, lowBalance, showSpecial, state.balance, state.day]);

      // 忙碌时守炉炼丹（自测台锁定姿态时跳过：否则 idle/forge 会被归一回 idle，量不到坐姿）
      React.useEffect(() => {
        seenBusy.current = !!state.busy;
        if (TEST_POSE) return;
        setPose((p) => ((p === 'idle' || p === 'forge') ? (state.busy ? 'forge' : 'idle') : p));
      }, [state.busy]);

      // 供定时器读到最新状态，避免闭包拿旧值
      const pv = React.useRef({ seq: -1, special: null, pose: 'idle' });
      pv.current = { seq: seq, special: special, pose: pose };

      // 站桩轮换：安静时在 静立 / 负手 / 抬头 之间慢慢换，别像块木头
      React.useEffect(() => {
        const list = ['idle', 'back', 'sky', 'walk'];
        const id = setInterval(() => {
          const cur = pv.current;
          if (Date.now() - lastActive.current < 8000) return;
          if (cur.seq >= 0 || cur.special) return;
          if (list.indexOf(cur.pose) < 0) return;
          setPose(list[(list.indexOf(cur.pose) + 1) % list.length]);
        }, 14000);
        return () => clearInterval(id);
      }, []);

      // 余额读不出来：摊手，说清楚哪儿错了（同一条错误只提醒一次）
      React.useEffect(() => {
        const err = state.balanceError;
        if (!err || errAlerted.current === err) return;
        errAlerted.current = err;
        showSpecial([
          { style: { fontSize: 13, fontWeight: 700, color:'var(--xjj-bub-warn)' }, modules: [{ type: 'text', text: '读数失败' }] },
          { style: { marginTop: 2, fontSize: 11.5 }, modules: [{ type: 'text', text: String(err) }] },
        ], 9000, 'shrug');
      }, [showSpecial, state.balanceError]);

      // 温馨提示：喝水/歇眼/走动/吃饭，按类别轮转，避免连着说同一类
      const wellIdx = React.useRef(0);

      const sayWellness = React.useCallback((forced) => {
        const cur = pv.current;
        if (!forced && (cur.seq >= 0 || cur.special)) return;
        const h = beijingHour();
        if (!forced && (h >= 23 || h < 6)) return;   // 深夜交给「劝睡」，不重复唠叨
        const n = WELLNESS.length;
        let item = null;
        for (let i = 0; i < n; i += 1) {
          const cand = WELLNESS[(wellIdx.current + i) % n];
          if (forced || cand.kind !== 'meal' || (h >= 6 && h < 8) || (h >= 11 && h < 13) || (h >= 17 && h < 20)) {
            item = cand;
            wellIdx.current = (wellIdx.current + i + 1) % n;
            break;
          }
        }
        if (!item) return;
        const line = item.lines[Math.floor(Math.random() * item.lines.length)];
        playSfx('alert');
        showSpecial([{ style: { fontSize: 12.8, lineHeight: 1.55 }, modules: [{ type: 'text', text: line }] }], 9000, item.pose);
      }, [showSpecial, playSfx, cfg.texts]);

      React.useEffect(() => {
        if ((cfg.notice || {}).wellness === false) return undefined;
        const mins = Math.max(10, Number((cfg.wellness || {}).everyMin) || 30);
        const id = setInterval(() => sayWellness(false), mins * 60000);
        return () => clearInterval(id);
      }, [cfg.notice, cfg.wellness, sayWellness]);

      // 闲聊：每 N 分钟一句（配置可关）。文案可带姿态 / 音效 / 补一句。
      const lastChat = React.useRef(-1);
      React.useEffect(() => {
        const ch = cfg.chatter || {};
        if (ch.on === false) return;
        const everyMs = Math.max(5, Number(ch.everyMin) || 10) * 60000;
        const id = setInterval(() => {
          const cur = pv.current;
          if (cur.seq >= 0 || cur.special || cur.pose === 'sleep') return;
          const list = (Array.isArray(cfg.idle) ? cfg.idle : []).filter(Boolean);
          if (!list.length) return;
          let idx = Math.floor(Math.random() * list.length);
          if (list.length > 1 && idx === lastChat.current) idx = (idx + 1) % list.length;   // 不连着说同一句
          lastChat.current = idx;
          const item = list[idx];
          const isObj = !!item && typeof item === 'object';
          const text = String(isObj ? (item.text || '') : item);
          if (!text) return;
          const pose = isObj && item.pose && POSES[item.pose] ? item.pose : undefined;
          const sfx = isObj && item.sfx && SFX[item.sfx] ? item.sfx : null;
          // 闲聊配色：按句子序号轮换，同一句永远是同一个色（不随机跳）；
          // 想单独指定就写成对象并给 color 字段，优先级最高。
          // 2026-10-25 改：去掉天青/藕荷/秋香（在深气泡上跳），统一走暖白→浅金一条线
          // 2026-10-27：深色走暖白→浅金；浅色必须换墨/金/灰 —— #EFD9B8 在米白气泡上只有 1.35:1
          const CHAT_COLORS = isLight ? ['#2A2418', '#8A5F16', '#5A4E38'] : ['#FFFCF4', '#F6E3C0', '#EFD9B8'];
          const chatColor = (isObj && item.color) || CHAT_COLORS[idx % CHAT_COLORS.length];
          // 2026-10-25 修：正文自带 \n 的多行也要分行上色——第一行用轮换色，其余行固定金黄
          const parts = String(text).split(/\n+/).filter(function (s) { return s.trim(); });
          const lines = [{
            style: { fontSize: 14, color: chatColor, letterSpacing: .3 },
            modules: [{ type: 'text', text: parts[0] || '' }],
          }];
          for (let k = 1; k < parts.length; k += 1) {
            lines.push({
              style: { fontSize: 10.5, color:'var(--xjj-bub-gold)', opacity: 1, marginTop: 2, letterSpacing: .5 },
              modules: [{ type: 'text', text: parts[k] }],
            });
          }
          if (isObj && item.extra) {
            // 2026-10-25：第二行固定用金黄，和第一行的暖白/浅金形成红金对比
            lines.push({ style: { fontSize: 10.5, color:'var(--xjj-bub-gold)', opacity: 1, marginTop: 2, letterSpacing: .5 }, modules: [{ type: 'text', text: String(item.extra) }] });
          }
          if (sfx) playSfx(sfx);
          showSpecial(lines, 6000, pose);
        }, everyMs);
        return () => clearInterval(id);
      }, [cfg.chatter, cfg.idle, showSpecial, playSfx]);


      const wake = React.useCallback(() => {
        lastActive.current = Date.now();
        setPose((p) => (p === 'sleep' ? basePose() : p));
      }, [basePose]);


      // 剑舞：24 帧连播（每帧 130ms，约 3.1 秒），播完回底姿
      const DANCE_FRAMES = ['dance01', 'dance02', 'dance03', 'dance04', 'dance05', 'dance06', 'dance07', 'dance08', 'dance09', 'dance10', 'dance11', 'dance12', 'dance13', 'dance14', 'dance15', 'dance16', 'dance17', 'dance18', 'dance19', 'dance20', 'dance21', 'dance22', 'dance23', 'dance24'];
      const playDance = React.useCallback(() => {
        playSfx('wind');
        let k = 0;
        setPose(DANCE_FRAMES[0]);
        const id = setInterval(() => {
          k += 1;
          if (k >= DANCE_FRAMES.length) { clearInterval(id); setPose(basePose()); return; }
          setPose(DANCE_FRAMES[k]);
        }, 130);
        later(() => { clearInterval(id); setPose(basePose()); }, DANCE_FRAMES.length * 130 + 300);
      }, [basePose, later, playSfx]);

      const advance = React.useCallback(() => {
        lastActive.current = Date.now();
        picks.current = {};
        if (special) { specialGen.current += 1; setSpecial(null); setPose(basePose()); return; }
        // 气泡关掉时：点一下只做动作，不冒泡
        if (cfg.bubbleOn === false) {
          // 关掉气泡时的随机动作：不放 refuse —— "拒绝"没有上下文，随机摆出来很怪
          const list = ['greet', 'ledger', 'sword', 'tea', 'coins', 'shrug', 'bye'];
          react(list[Math.floor(Math.random() * list.length)], 1800);
          return;
        }
        const len = (cfg.queue || []).length;
        const next = seq + 1;
        const target = next > len - 1 ? -1 : next;
        setSeq(target);
        setSlash((n) => n + 1);
        if (target === 0) {
          react('greet', 2600); // 道友请留步 → 作揖（不用"抬手"：抬手现在固定表示拒绝）
        } else if (target > 0) {
          const item = cfg.queue[target - 1] || {};
          if (Array.isArray(item.poses) && item.poses.length > 1) {
            // 连续动作（如剑舞）：按间隔连播，播完回到底姿
            const seqPoses = item.poses.slice();
            let k = 0;
            setPose(seqPoses[0]);
            const stepMs = Math.max(180, Number(item.poseMs) || 420);
            const id = setInterval(() => {
              k += 1;
              if (k >= seqPoses.length) { clearInterval(id); return; }
              setPose(seqPoses[k]);
            }, stepMs);
            later(() => { clearInterval(id); setPose(basePose()); }, seqPoses.length * stepMs + 260);
          } else {
            react(item.pose || 'win', 2600); // 每项自带动作：账目→看账本、剑来→拔剑
          }
        } else {
          react('bye', 1800); // 收起泡泡 → 抱拳告辞
        }
        fetch('/xjj/state.json?refresh=1', { credentials: 'same-origin' })
          .then((r) => r.json())
          .then((d) => { if (d && d.ok) setState(d); })
          .catch(() => {});
      }, [basePose, cfg.bubbleOn, cfg.queue, react, seq, special]);

      // 气泡自动收起：显示后 N 秒自动消失（默认 6 秒），期间再点会重新计时
      React.useEffect(() => {
        if (seq < 0) return undefined;
        const hold = Number(cfg.bubbleHoldSec) > 0 ? Number(cfg.bubbleHoldSec) : 3;
        const id = setTimeout(() => {
          setSeq(-1);
          // 气泡到点自动收起时不能收姿势：它 3 秒一到就打回底姿 —— 御剑后半段变动作就是这条
          if (!flyingRef.current) setPose(basePose());
        }, hold * 1000);
        return () => clearTimeout(id);
      }, [seq, slash, basePose, cfg.bubbleHoldSec]);

      // 配置写回（菜单 / 拖拽都走这里）
      const updateCfg = React.useCallback((mutate) => {
        const next = JSON.parse(JSON.stringify(cfg));
        mutate(next);
        setCfg(next);
        saveConfig(next);
      }, [cfg]);

      const onPointerDown = React.useCallback((event) => {
        if (event.button !== 0) return;
        if (flying) {
          if (Date.now() - flightAt.current < 900) return;   // 同上：起飞瞬间的按下不算「落地」
          stopFlight(true); return;   // 飞行中按下 = 落地，不进入拖动
        }
        event.preventDefault();
        const rect = rootRef.current ? rootRef.current.getBoundingClientRect() : null;
        drag.current = {
          active: true,
          moved: false,
          startX: event.clientX,
          startY: event.clientY,
          originX: pos ? pos.x : (rect ? rect.left : window.innerWidth - 166),
          originY: pos ? pos.y : (rect ? rect.top : window.innerHeight - 170),
        };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch (err) { /* 老浏览器 */ }
        busyTouch.current = true;
        setDragging(true);
        wake();
        playSfx('press');
      }, [playSfx, pos, wake]);

      const onPointerMove = React.useCallback((event) => {
        const d = drag.current;
        if (!d.active) return;
        const dx = event.clientX - d.startX;
        const dy = event.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) > 4) {
          d.moved = true;
          setMenuOpen(false);
        }
        if (!d.moved) return;
        const el = rootRef.current;
        const w = (el ? el.offsetWidth : 176);
        const h = (el ? el.offsetHeight : 268);
        const maxX = Math.max(0, window.innerWidth - w - 2);
        const maxY = Math.max(0, window.innerHeight - h - 2);
        setPos({
          x: Math.min(Math.max(0, d.originX + dx), maxX),
          y: Math.min(Math.max(0, d.originY + dy), maxY),
        });
      }, [uiScale]);

      // 指针被系统中断（切换窗口、触控取消、失去捕获）：把拖动状态复位，
      // 否则 busyTouch 会一直为 true，位置重算永久失效
      const onPointerCancel = React.useCallback(() => {
        drag.current.active = false;
        drag.current.moved = false;
        busyTouch.current = false;
        setDragging(false);
      }, []);

      const onPointerUp = React.useCallback(() => {
        const d = drag.current;
        d.active = false;
        busyTouch.current = false;
        setDragging(false);
        if (!d.moved) {
          playSfx('release');
          return;
        }
        const el = rootRef.current;
        const w = (el ? el.offsetWidth : 176);
        const h = (el ? el.offsetHeight : 268);
        const W = window.innerWidth;
        const H = window.innerHeight;
        const snap = 22;
        let x = d.moved && pos ? pos.x : (W - w - 6);
        let y = pos ? pos.y : (H - h - 10);
        if (x < snap) x = 6;
        if (y < snap) y = 6;
        if (W - (x + w) < snap) x = Math.max(0, W - w - 6);
        if (H - (y + h) < snap) y = Math.max(0, H - h - 10);
        // 记成「离哪个角多远」，这样窗口缩放/最大化后仍贴着那个角
        const anchor = (y + h / 2 < H / 2 ? 't' : 'b') + (x + w / 2 < W / 2 ? 'l' : 'r');
        const dx = anchor.endsWith('l') ? x : Math.max(0, W - (x + w));
        const dy = anchor.startsWith('t') ? y : Math.max(0, H - (y + h));
        setPos({ x: x, y: y });
        updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { anchor: anchor, dx: dx, dy: dy, x: x, y: y }); });
        // 落地：拖动结束才收回底姿（此时 drag.active 已是 false，react 的定时器不会再拦）
        setPose(basePose());
      }, [basePose, playSfx, pos, uiScale, updateCfg]);


      // 位置：按「最近的角 + 距边距离」记，窗口缩放 / 最大化 / 换分辨率后自动贴回那个角
      const rootSize = React.useCallback(() => ({
        w: (rootRef.current ? rootRef.current.offsetWidth : 176),
        h: (rootRef.current ? rootRef.current.offsetHeight : 268),
      }), [uiScale]);

      // 窗口尺寸变化：更新视口尺寸，面板跟着改宽高，不再溢出
      React.useEffect(() => {
        const onResize = () => {
          setVp({ w: window.innerWidth, h: window.innerHeight });
          placeRef.current && placeRef.current();     // 位置也立刻重算
        };
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        // 兜底轮询：最大化/恢复在某些环境下不触发 resize
        const id = setInterval(() => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setVp((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
          placeRef.current && placeRef.current();
        }, 800);
        return () => {
          window.removeEventListener('resize', onResize);
          window.removeEventListener('orientationchange', onResize);
          clearInterval(id);
        };
      }, []);
      const placeRef = React.useRef(null);
      const placeFromCfg = React.useCallback(() => {
        // 拖动/长按期间不要重算：否则每 800ms 会把人拽回旧角落，看起来在晃
        if (busyTouch.current) return;

        const ui = cfg.ui || {};
        const { w, h } = rootSize();
        const W = window.innerWidth;
        const H = window.innerHeight;
        let anchor = ui.anchor;
        let dx = Number(ui.dx);
        let dy = Number(ui.dy);
        if (!anchor || !Number.isFinite(dx) || !Number.isFinite(dy)) {
          if (Number.isFinite(ui.x) && Number.isFinite(ui.y)) {
            // 老配置是绝对坐标：换算成「距右下角多远」
            anchor = 'br';
            dx = Math.max(0, W - ui.x - w);
            dy = Math.max(0, H - ui.y - h);
          } else {
            anchor = 'br';
            dx = 6;
            dy = 10;
          }
        }
        const x = anchor.endsWith('l') ? dx : W - w - dx;
        const y = anchor.startsWith('t') ? dy : H - h - dy;
        const nx = Math.max(0, Math.min(x, Math.max(0, W - w - 2)));
        const ny = Math.max(0, Math.min(y, Math.max(0, H - h - 2)));
        // 每 800ms 轮询都会调到这里：位置没变就别 setState，免得整页一直重渲染
        setPos((prev) => (prev && prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny }));
        // 老配置只有绝对坐标：把换算结果写回去，之后窗口缩放才会跟着角走
        if (!ui.anchor || !Number.isFinite(Number(ui.dx))) {
          updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { anchor: anchor, dx: dx, dy: dy, x: null, y: null }); });
        }
      }, [cfg.ui, rootSize, updateCfg]);

      React.useEffect(() => {
        if (!dragging) placeFromCfg();
      }, [dragging, placeFromCfg]);

      // 窗口尺寸一变（最大化 / 还原 / 换屏）就按角重新贴
      React.useEffect(() => {
        placeRef.current = placeFromCfg;
      const onResize = () => { if (!drag.current.active) placeFromCfg(); };
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        window.addEventListener('focus', onResize);
        return () => {
          window.removeEventListener('resize', onResize);
          window.removeEventListener('orientationchange', onResize);
          window.removeEventListener('focus', onResize);
        };
      }, [placeFromCfg]);


      // 菜单打开时点外面收起
      React.useEffect(() => {
        if (!menuOpen) return;
        const onDocDown = (ev) => {
          const m = menuRef.current;
          const r = rootRef.current;
          if (m && m.contains(ev.target)) return;
          if (r && r.contains(ev.target)) return;
          setMenuOpen(false);
        };
        document.addEventListener('pointerdown', onDocDown, true);
        return () => document.removeEventListener('pointerdown', onDocDown, true);
      }, [menuOpen]);

      const toggleMenu = React.useCallback((ev) => {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        lastActive.current = Date.now();
        const willOpen = !menuOpen;
        playSfx('panel');
        if (willOpen) { specialGen.current += 1; setSeq(-1); setSpecial(null); setPanelAt(null); }  // 开面板时收起气泡，别叠在一起
        setMenuOpen(willOpen);
      }, [menuOpen]);

      // 彻底禁止原生拖拽（图片幽灵图）：在捕获阶段拦掉所有 dragstart
      React.useEffect(() => {
        const stop = (ev) => { ev.preventDefault(); };
        document.addEventListener('dragstart', stop, true);
        return () => {
          document.removeEventListener('dragstart', stop, true);
        };
      }, []);
      // 面板拖动：按住标题栏移动，松手记住位置
      const panelDrag = React.useRef({ on: false, dx: 0, dy: 0 });
      const onPanelDown = React.useCallback((ev) => {
        if (ev.button !== 0) return;
        const el = menuRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        panelDrag.current = { on: true, dx: ev.clientX - r.left, dy: ev.clientY - r.top };
        ev.preventDefault();
        ev.stopPropagation();
        const move = (e) => {
          if (!panelDrag.current.on) return;
          const w = menuRef.current ? menuRef.current.offsetWidth : 272;
          const h = menuRef.current ? menuRef.current.offsetHeight : 300;
          const x = Math.max(4, Math.min(vp.w - w - 4, e.clientX - panelDrag.current.dx));
          const y = Math.max(4, Math.min(vp.h - h - 4, e.clientY - panelDrag.current.dy));
          setPanelAt({ x, y });
        };
        const up = () => {
          panelDrag.current.on = false;
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);

        };
        panelDrag.current.on = true;
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      }, [vp, updateCfg]);

      const onEnter = React.useCallback(() => {
        setHovering(true);
        lastActive.current = Date.now();
        if (flyingRef.current) return;
        setPose((p) => (p === 'sleep' ? basePose() : p));
      }, [basePose]);

      const onLeave = React.useCallback(() => {
        setHovering(false);
        lastActive.current = Date.now();
        // 拖动/飞行时不许把姿势打回底姿（拖动必然离开人物范围；飞行时指针本来就在外）
        if (drag.current.active || flyingRef.current) return;
        setPose((p) => (p === 'sleep' ? p : basePose()));
      }, [basePose]);

      const onClick = React.useCallback((event) => {
        event.preventDefault();
        if (flying) {
          // 连点第 5 下起飞，第 6 下不该把刚起飞的这一圈按下来。起飞后 900ms 内的点击一律忽略。
          if (Date.now() - flightAt.current < 900) return;
          stopFlight(true);   // 飞行中点一下 = 立即落地
          return;
        }
        const now = Date.now();
        clickTimes.current = clickTimes.current.filter((t) => now - t < 3000);
        clickTimes.current.push(now);
        // 连点 5 下（3 秒内）：御剑飞出去一圈
        if (clickTimes.current.length >= 5) {
          clickTimes.current = [];
          startFlight();
          return;
        }
        // 深夜连点 3 下：打哈欠赶人去睡（不清零 —— 继续点满 5 下就改飞出去）
        const h = beijingHour();
        if ((h >= 23 || h < 6) && clickTimes.current.length === 3) {
          // 配「别点了，去睡」用打哈欠（yawn），不用"抬手拒绝"——文案在说困，动作也该是困
          showSpecial([{ style: { fontSize: 15, fontWeight: 700, color:'var(--xjj-bub-gold)' }, modules: [{ type: 'text', text: (cfg.texts || {}).lateNag || '别点了，去睡。' }] }], 3600, 'yawn', 'alert');
          // 必须 return：继续 advance() 会把姿势换成队列里那一项（数灵石），"别点了"配着数灵石出现
          return;
        }
        advance();
      }, [advance, cfg.texts, playSfx, react, showSpecial, startFlight]);

      const onKeyDown = React.useCallback((event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          advance();
        }
      }, [advance]);

      function currentBubble() {
        if (special) return { lines: special.lines, special: true };
        if (seq < 0) return null;
        if (seq === 0) return cfg.first ? { lines: cfg.first.lines || [] } : null;
        const item = (cfg.queue || [])[seq - 1];
        if (!item) return null;
        const variants = Array.isArray(item.variants) && item.variants.length ? item.variants : [{ weight: 1, lines: [] }];
        const key = 'variant:' + seq;
        if (!picks.current[key]) picks.current[key] = weightedPick(variants, null);
        return picks.current[key] || variants[0];
      }

      const bubble = currentBubble();
      const INK = 'linear-gradient(180deg,rgba(20,22,25,.985),rgba(7,8,10,.985))';
      // 用户配的底色要真的生效：以前这里最后又写了一次 { background: INK }，把配置覆盖成了死配置
      // （`style.bg` 有默认值、README 也在教，但从来没被用上 —— 2026-10-26 修）
      // 2026-10-27：默认底色/字色跟随主题；用户显式改过的才保留（否则浅色下气泡还是墨底）
      const themeBg = isLight ? '#FFFDF7' : INK;
      const usingDefaultBg = !cfg.style || cfg.style.bg === undefined || cfg.style.bg === DEFAULT_CONFIG.style.bg;
      const usingDefaultColor = !cfg.style || cfg.style.color === undefined || cfg.style.color === DEFAULT_CONFIG.style.color;
      const userBg = usingDefaultBg ? themeBg : cfg.style.bg;
      const style = Object.assign({ background: themeBg, color:'var(--xjj-bub-text)', fontSize: 14, borderRadius: 13, maxWidth: 296 }, cfg.style || {}, { background: userBg });
      if (usingDefaultColor) style.color = 'var(--xjj-bub-text)';

      // 气泡里的颜色不靠 CSS 变量继承——实测在浅色下 `var(--xjj-bub-*)` 没有解析成昼值，
      // 而内联 background 又是直接算的，两边不同步。这里统一在 JS 里按 scheme 解析成具体色。
      const BUB_COLORS = isLight
        ? { text: '#2A2418', gold: '#8A5F16', cyan: '#1F6B7A', dim: '#5A4E38', warn: '#A8402E' }
        : { text: '#F3E6C8', gold: '#F5C24B', cyan: '#9FE7F5', dim: '#A9B6BE', warn: '#FFB3A7' };
      // 用户配置里存着旧颜色（hex），`mergeConfig` 会原样保留 first/queue，所以模板改了也不生效。
      // 浅色下把这些旧浅色也映射成深色版，不然「配置里存过的气泡」永远看不清。
      const BUB_LEGACY = {
        text: ['#F3E6C8', '#F6E3C0', '#FFFCF4', '#E8EEF3'],
        gold: ['#F5C24B', '#E8B84B', '#FFC247', '#FFE9B8', '#E7C892', '#D9A441'],
        cyan: ['#9FE7F5', '#7BEAFF', '#BFE6F5', '#8FD8F0'],
        dim: ['#C9D3E0', '#A9B6BE', '#C9B98F', '#93A3AB', '#F8CDBE'],
        warn: ['#FFB3A7', '#FF9E7A', '#E7A98C'],
      };
      function resolveBub(c) {
        const s = String(c || '').trim();
        if (!s) return c;
        const m = /^var\(--xjj-bub-([a-z]+)\)$/.exec(s);
        if (m && BUB_COLORS[m[1]]) return BUB_COLORS[m[1]];
        if (isLight) {
          const up = s.toUpperCase();
          for (const k of Object.keys(BUB_LEGACY)) {
            if (BUB_LEGACY[k].indexOf(up) >= 0) return BUB_COLORS[k];
          }
        }
        return c;
      }
      if (style.color) style.color = resolveBub(style.color);
      // 可读性底线：字号不低于 13.5，宽度给到 296 起步（字大了不挤成三行），墨色也提亮
      style.fontSize = readableFont(style.fontSize);
      style.maxWidth = Math.max(296, Number(style.maxWidth) || 276);
      // 提亮只在深色主题成立：浅色下它会把墨色反提成浅灰（第一行标题继承根色，全被提没了）
      if (!isLight) style.color = brightenColor(style.color) || style.color;
      style['--xjj-bubble-bg'] = userBg;   // 尾巴跟着底色走，否则浅底上会挂一块黑三角

      function moduleVars() {
        const peak = state.peak || {};
        return {
          v: money(state.balance), bal: money(state.balance),
          today: money(state.todayUsed), todayRaw: Number(state.todayUsed || 0).toFixed(2),
      turns: String(Number(state.todayTurns) || 0),
      avg: (Number(state.todayTurns) > 0 ? money(Number(state.todayUsed || 0) / Number(state.todayTurns)) : '—'),
      last: (state.lastTurn && Number(state.lastTurn.amount) > 0 ? money(state.lastTurn.amount) : '—'),
          label: peak.label || '—', next: peak.next || '', window: peak.window || '', cd: fmtCd(peak.nextInMs), day: state.day || '',
        };
      }

      function moduleText(mod, key) {
        const vars = moduleVars();
        switch (mod.type) {
          // 用户改过的文案原样显示；还停在默认中文的（字典里有）会被翻成当前语言
          case 'text': return T(mod.text || '');
          case 'balance': return fill(mod.fmt || '{v}', vars);
          case 'today': return fill(mod.fmt || '{today}', vars);
          case 'peak': return fill(mod.fmt || '{label} · 距{next} {cd}', vars);
        case 'turns': return fill(mod.fmt || '{turns}', vars);
        case 'avg': return fill(mod.fmt || '{avg}', vars);
        case 'last': return fill(mod.fmt || '{last}', vars);
          case 'random': {
            if (!picks.current[key]) {
              const chosen = weightedPick(mod.items, picks.current[key + ':last']);
              picks.current[key] = chosen ? (chosen.text || '') : '';
              picks.current[key + ':last'] = chosen;
            }
            return picks.current[key];
          }
          default: return '';
        }
      }

      function moduleStyle(mod) {
        const s = mod.style || {};
        const out = {};
        if (mod.type === 'peak') {
          const lb = String((state.peak || {}).label || '');
          out.color = lb.indexOf('谷') >= 0
          ? (isLight ? '#1E7A4C' : '#6FE7B8')
          : (lb.indexOf('高峰') >= 0 ? (isLight ? '#A85A1A' : '#FFB265') : (isLight ? '#1F6B7A' : '#8FD8F0'));
          out.fontWeight = 700;
        }
        if (s.fontSize) out.fontSize = readableFont(s.fontSize);
        if (s.color) out.color = isLight ? resolveBub(s.color) : brightenColor(s.color);
        if (s.fontWeight) out.fontWeight = s.fontWeight;
        if (s.fontStyle) out.fontStyle = s.fontStyle;
        if (s.textDecoration) out.textDecoration = s.textDecoration;
        if (s.fontFamily) out.fontFamily = s.fontFamily;
        if (s.opacity) out.opacity = s.opacity;
        return out;
      }

      const corners = () => [
        h('i', { className: 'xjj-c xjj-c-tl', key: 'tl' }),
        h('i', { className: 'xjj-c xjj-c-tr', key: 'tr' }),
        h('i', { className: 'xjj-c xjj-c-bl', key: 'bl' }),
        h('i', { className: 'xjj-c xjj-c-br', key: 'br' }),
      ];

      function renderLine(line, lineIndex, pathOf) {
        const ls = line.style || {};
        const rawColor = (ls.color || (lineIndex === 0 ? undefined : '#E8B84B'));
        const lineStyle = {
          // 行里写 noFloor: true 才允许低于 14px（只给次要信息用，比如消耗气泡第三行的模型名）
          fontSize: ls.noFloor ? Math.max(11, Number(ls.fontSize) || 12) : readableFont(ls.fontSize),
          // 2026-10-25 最终修：按行号上色——第一行用文案自带色（轮换），从第二行起一律金黄。
          // 2026-10-26 补：颜色统一过一遍提亮（暗灰/暗金往白里挪），保证深底上看得清。
          color: rawColor ? (isLight ? resolveBub(rawColor) : brightenColor(rawColor)) : undefined,
          fontWeight: (ls.fontWeight !== undefined ? ls.fontWeight : (lineIndex === 0 ? undefined : 700)), fontStyle: ls.fontStyle,   // 第二行起金黄 + 加粗
          textDecoration: ls.textDecoration, fontFamily: ls.fontFamily, marginTop: ls.marginTop,
          opacity: (Number(ls.opacity) > 0 && Number(ls.opacity) < 0.92) ? 0.92 : ls.opacity,
          lineHeight: ls.lineHeight, letterSpacing: ls.letterSpacing,
          textShadow: ls.textShadow || (isLight ? 'none' : '0 1px 2px rgba(0,0,0,.45)'),
        };
        const mods = (line.modules || []).map((mod, modIndex) => {
          if (mod.type === 'image') {
            return h('img', {
              key: modIndex,
              src: mod.src,
              alt: '',
              style: { display: 'block', width: '100%', height: mod.height || 80, objectFit: 'contain', marginTop: 4, borderRadius: 6 },
              draggable: false,
            });
          }
          const key = (seq < 0 ? 'sp' : seq) + ':' + lineIndex + ':' + modIndex;
      return h('span', { key: modIndex, style: moduleStyle(mod) }, moduleText(mod, key));
        });
        return h('div', { className: 'xjj-line', key: lineIndex, style: lineStyle }, mods);
      }


      // 飞行中不显示气泡：气泡挂在 root 上，人物飞出去了会看着错位
      const bubbleNode = (bubble && !flying) ? h('div', {
        className: 'xjj-bubble' + (leftSide ? ' is-left' : ''),
        key: 'bubble',
        style: style,
        onClick: (e) => { e.stopPropagation(); advance(); },
        role: 'status',
      }, corners(), (bubble.lines || []).map((line, i) => {
        const pathOf = bubble.special
          ? { scope: 'special', index: 0, variant: 0 }
          : (seq === 0
            ? { scope: 'first', index: 0, variant: 0 }
            : { scope: 'queue', index: seq - 1, variant: (cfg.queue[seq - 1].variants || []).indexOf(picks.current['variant:' + seq]) });
        return renderLine(line, i, pathOf);
      })) : null;

      const soundOn = (cfg.sound || {}).on !== false;
      const volume = Math.round(Number((cfg.sound || {}).volume === undefined ? 0.5 : (cfg.sound || {}).volume) * 100);

      // 坐/蹲类姿态按内容高度归一后身体会显大（站立姿态那 479px 里有腿，坐姿没有），
      // 这几张单独缩一点；以脚底为原点缩，别让人浮起来。系数在 src/layout.json（几何真源）。
      const POSE_FIT = LAYOUT.poseFit || {};
      // 白衣缺剑舞/sleep：用 Object.assign 让白衣覆盖黑衣，缺的键仍指向黑衣
      const POSE_TABLE = useWhite ? Object.assign({}, POSES, POSES_WHITE) : POSES;
      const sprite = (name) => h('img', {
        key: name,
        src: POSE_TABLE[name] || POSES[name],
        alt: '',
        draggable: false,
        'data-pose': name,
        className: 'xjj-sprite' + ((POSES[pose] ? pose : 'idle') === name ? ' is-on' : ''),
        style: POSE_FIT[name]
          ? { transform: 'translateX(-50%) scale(' + POSE_FIT[name] + ')', transformOrigin: '50% 100%' }
          : undefined,
      });

      const notice = cfg.notice || {};
      const bubbleOn = cfg.bubbleOn !== false;
      const chatter = cfg.chatter || {};
      const warnLow = Number((cfg.warn || {}).balanceLow === undefined ? 10 : (cfg.warn || {}).balanceLow);

      // 预览全部常驻动作（23 个）：逐个切换并浮标显示「第 N/23 · 动作名」（sleep 是状态不是动作，不进预览）
      const POSE_CN = {
        idle: '静立', greet: '作揖', sword: '擦剑', fly: '御剑', ledger: '看玉简',
        shrug: '摊手', refuse: '抬手', bye: '收剑', win: '举拳', angry: '冷怒',
        poor: '掏钱袋', coins: '数灵石', forge: '守炉', doze: '打盹', yawn: '打哈欠',
        tea: '递茶', meditate: '打坐', sleep: '睡了', back: '负手', sky: '抬头', walk: '缓步',
        sip: '小酌', wipe: '拔剑', chin: '抚颔',
      };
      function parade() {
        setMenuOpen(false);
        clearTimers();
        const list = ['idle', 'greet', 'sword', 'fly', 'ledger', 'shrug', 'refuse', 'bye', 'win', 'angry',
          'poor', 'coins', 'forge', 'doze', 'yawn', 'tea', 'meditate', 'back', 'sky', 'walk',
          'sip', 'wipe', 'chin'];
        const stepMs = 700;
        let k = 0;
        const show = () => {
          const key = list[k];
          setPose(key);
          k += 1;
        };
        show();
        const id = setInterval(() => {
          if (k >= list.length) {
            clearInterval(id);
            setPose(basePose());
            setSpecial(null);
            return;
          }
          show();
        }, stepMs);
        later(() => { clearInterval(id); setPose(basePose()); setSpecial(null); }, list.length * stepMs + 600);
      }

      // —— 功能面板：分页 + 控件 ——
      const Tab = (id, label) => h('button', {
        className: 'xjj-tab' + (menuTab === id ? ' on' : ''),
        onClick: (e) => { e.stopPropagation(); setMenuTab(id); },
      }, label);

      const Sw = (on, fn) => h('button', {
        className: 'xjj-sw' + (on ? ' on' : ''),
        onClick: (e) => { e.stopPropagation(); fn(); },
      }, h('i'));

      const Step = (val, dec, inc) => h('div', { className: 'xjj-step' },
        h('button', { onClick: (e) => { e.stopPropagation(); dec(); } }, '−'),
        h('b', null, val),
        h('button', { onClick: (e) => { e.stopPropagation(); inc(); } }, '+'));

      const Btn = (txt, fn) => h('button', {
        className: 'xjj-btn',
        onClick: (e) => { e.stopPropagation(); fn(); },
      }, txt);

      const Row = (label, ctrl, sub) => h('div', { className: 'xjj-row' },
        h('div', { className: 'xjj-rowmain' },
          h('span', { className: 'xjj-lbl' }, label),
          sub ? h('small', null, sub) : null),
        ctrl);

      const setVol = (v) => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { volume: v }); });

      // 自检：版本 / 语言 / 构建是否新鲜（2026-10-27 按要求去掉「账本」「等待」两行）
      // （只读一次 about.json，不联网；主要用来揪“改了模板忘跑 build.py”）
      const showAbout = React.useCallback(async () => {
        let d = null;
        try {
          const res = await fetch('/xjj/about.json', { credentials: 'same-origin' });
          d = await res.json();
        } catch (err) { d = null; }
        if (!d || !d.ok) {
          showSpecial([{ style: { fontSize: 12 }, modules: [{ type: 'text', text: '自检失败：/xjj/about.json 没响应（宿主改完要重启客户端）' }] }], 9000, 'shrug');
          return;
        }
        const b = d.build || {};
        const led = d.ledger || {};
        const files = d.files || {};
        const kb = (f) => (f && Number(f.bytes) ? Math.round(Number(f.bytes) / 1024) + ' KB' : '—');
        const at = (f) => (f && f.at ? String(f.at).slice(5, 16).replace('T', ' ') : '—');
        const buildTxt = b.stale
          ? '落后模板 ' + Math.abs(Number(b.minutes) || 0) + ' 分钟（该跑 build.py）'
          : '最新 · ' + at(files.client);
        showSpecial([
          { style: { fontSize: 11, letterSpacing: 3, color:'var(--xjj-bub-text)' }, modules: [{ type: 'text', text: '自 检' }] },
          { style: { marginTop: 3, fontSize: 12, color:'var(--xjj-bub-text)' }, modules: [{ type: 'text', text: '版本 v' + String(d.version || '?') + ' · 前端 ' + kb(files.client) }] },
          // 语言一行：排查「切了英文但还是中文」时先看这里（显示中文 = 没拿到宿主 locale）
          { style: { fontSize: 11.5, color:'var(--xjj-bub-cyan)' }, modules: [{ type: 'text', text: '语言 ' + (lang === 'en' ? 'English' : '中文') + (window.__XJJ_I18N ? '' : '（缺 i18n 预置）') }] },
          { style: { fontSize: 11.5, color: b.stale ? '#FF9E7A' : '#9FE7F5' }, modules: [{ type: 'text', text: '构建 ' + buildTxt }] },
          Number(led.unpriced) ? { style: { fontSize: 11.5, color:'var(--xjj-bub-dim)' }, modules: [{ type: 'text', text: '未计价 ' + Number(led.unpriced) + ' 轮（模型不在价格表 / 非官方路由）' }] } : null,
          d.holiday && d.holiday.ok === false
            ? { style: { fontSize: 11.5, color:'var(--xjj-bub-warn)' }, modules: [{ type: 'text', text: '放假表只到 ' + String(d.holiday.through || '?') + ' 年，节假日会按工作日算' }] }
            : null,
        ].filter(Boolean), 12000, 'ledger');
      }, [showSpecial]);

      // —— 气泡编辑器 ——
      const openEditor = React.useCallback((target) => {
        const t = target || { kind: 'first' };
        if (t.kind === 'first') {
          setEditor({
            kind: 'first',
            title: '首次点击泡',
            lines: JSON.parse(JSON.stringify((cfg.first && Array.isArray(cfg.first.lines)) ? cfg.first.lines : [])),
          });
        } else {
          const item = (cfg.queue || [])[t.qi] || {};
          const vs = Array.isArray(item.variants) ? item.variants : [];
          const vi = Math.max(0, Math.min(Number(t.vi) || 0, vs.length - 1));
          const v = vs[vi] || {};
          setEditor({
            kind: 'queue',
            qi: t.qi,
            vi: vi,
            title: String(item.title || item.id || ('队列 ' + (t.qi + 1))),
            lines: JSON.parse(JSON.stringify(Array.isArray(v.lines) ? v.lines : [])),
          });
        }
        setSelLine(0);
        setSelMod(0);
        setConfirmReset(false);
        setAboutOpen(false);
        setMenuOpen(false);
      }, [cfg.first, cfg.queue]);

      // 恢复默认：只重置编辑器当前打开的那个目标（首次 / 队列某项的某个变体）。
      // 2026-10-27 从「更多」页搬进编辑器头部，并按他要求改成单目标 + 二次确认。
      const resetCurrent = React.useCallback(() => {
        if (!editor) return;
        const src = editor.kind === 'first'
          ? (DEFAULT_CONFIG.first || {})
          : (((DEFAULT_CONFIG.queue || []).find((q) => q.id === ((((cfg.queue || [])[editor.qi]) || {}).id))) || {});
        const dflt = editor.kind === 'first'
          ? (src.lines || [])
          : ((((src.variants || [])[editor.vi]) || {}).lines || []);
        updateCfg((n) => {
          if (editor.kind === 'first') {
            n.first = Object.assign({}, n.first || {}, { lines: JSON.parse(JSON.stringify(dflt)) });
          } else {
            const q = (n.queue || [])[editor.qi];
            if (q && Array.isArray(q.variants) && q.variants[editor.vi]) {
              q.variants[editor.vi].lines = JSON.parse(JSON.stringify(dflt));
            }
          }
        });
        setEditor((e) => (e ? Object.assign({}, e, { lines: JSON.parse(JSON.stringify(dflt)) }) : e));
        setConfirmReset(false);
      }, [editor, cfg.queue, updateCfg]);

      const edLines = (fn) => setEditor((e) => (e ? Object.assign({}, e, { lines: fn(e.lines || []) }) : e));
      const edLine = (i, fn) => edLines((ls) => ls.map((l, k) => (k === i ? fn(l) : l)));

      const saveEditor = React.useCallback(() => {
        if (!editor) return;
        const lines = editor.lines || [];
        updateCfg((n) => {
          if (editor.kind === 'first') {
            n.first = Object.assign({}, n.first || {}, { lines: lines });
          } else {
            const q = (n.queue || [])[editor.qi];
            if (q && Array.isArray(q.variants) && q.variants[editor.vi]) q.variants[editor.vi].lines = lines;
          }
        });
        setEditor(null);
        showSpecial([{ style: { fontSize: 12 }, modules: [{ type: 'text', text: '气泡已保存，点人物看效果' }] }], 3500, 'win');
      }, [editor, updateCfg, showSpecial]);

      const rows = (() => {
        if (menuTab === 'data') {
          return [
            Row('余额', h('b', { className: 'xjj-val' }, money(state.balance)),
              state.balanceError ? String(state.balanceError).slice(0, 18) : (state.source === 'account' ? '账号登录态' : (state.source || ''))),
            Row('今日已用', h('b', { className: 'xjj-val' }, money(state.todayUsed)), state.day || ''),
            Row('今日轮数', h('b', { className: 'xjj-val' }, String(state.todayTurns || 0) + ' 轮'),
              state.todayTurns ? ('平均 ' + money(state.todayUsed / state.todayTurns) + ' / 轮') : '还没有记录'),
            Row('最近一笔', h('b', { className: 'xjj-val' }, state.lastTurn ? money(state.lastTurn.amount) : '—'),
              state.lastTurn ? ((state.lastTurn.tokens || 0) + ' tokens · ' + (state.lastTurn.model || '')) : ''),
            Row('告急阈值', Step('¥' + warnLow,
              () => updateCfg((n) => { n.warn = Object.assign({}, n.warn || {}, { balanceLow: Math.max(0, warnLow - 5) }); }),
              () => updateCfg((n) => { n.warn = Object.assign({}, n.warn || {}, { balanceLow: warnLow + 5 }); }))),
            Row('刷新', Btn(refreshState === 'busy' ? '刷新中…' : (refreshState === 'done' ? '已刷新 ' + money(state.balance) : '立即刷新余额'), () => {
              if (refreshState === 'busy') return;
              setRefreshState('busy');
              const t0 = Date.now();
              fetch('/xjj/state.json?refresh=1', { credentials: 'same-origin', cache: 'no-store' })
                .then((r) => r.json())
                .then((d) => {
                  if (d && d.ok) setState(d);
                  const wait = Math.max(0, 700 - (Date.now() - t0));
                  refreshTimers.current.forEach(clearTimeout);
                  refreshTimers.current = [
                    setTimeout(() => setRefreshState('done'), wait),
                    setTimeout(() => setRefreshState('idle'), 2200),
                  ];
                })
                .catch(() => {
                  setRefreshState('idle');
                  showSpecial([{ style: { fontSize: 12 }, modules: [{ type: 'text', text: '刷新失败：宿主的 /xjj/state.json 没响应' }] }], 5000);
                });
            })),
            (() => {
              const hist = Array.isArray(state.history) ? state.history : [];
              if (!hist.length) {
                return Row('近 7 天', h('b', { className: 'xjj-val' }, '—'), '账本还没有记录');
              }
              const vals = hist.map((x) => Number(x.used) || 0);
              const maxV = Math.max(0.01, ...vals);
              const total = vals.reduce((s, v) => s + v, 0);
              const bars = hist.map((d, i) => {
                const v = vals[i];
                const pct = Math.max(4, Math.round((v / maxV) * 100));
                const isToday = i === hist.length - 1;
                const mmdd = String(d.date || '').slice(5).replace('-', '/');
                const tip = (d.date || '') + ' · ¥' + v.toFixed(2) + ' · ' + (Number(d.turns) || 0) + ' 轮';
                return h('div', { key: d.date || String(i), className: 'xjj-bar-col', title: tip },
                  h('div', { className: 'xjj-bar-val' }, v >= 1 ? v.toFixed(1) : (v > 0 ? v.toFixed(2) : '0')),
                  h('div', { className: 'xjj-bar-track' },
                    h('div', { className: 'xjj-bar-fill' + (isToday ? ' today' : ''), style: { height: pct + '%' } })),
                  h('div', { className: 'xjj-bar-day' }, mmdd));
              });
              return h('div', { className: 'xjj-hist' },
                h('div', { className: 'xjj-hist-head' },
                  h('span', { className: 'xjj-lbl' }, '近 7 天'),
                  h('span', { className: 'xjj-hist-sum' }, '合计 ¥' + total.toFixed(2))),
                h('div', { className: 'xjj-bars' }, bars));
            })(),
          ];
        }
        if (menuTab === 'ledger') {
          const segBtn = (key, label) => h('button', {
            key: 'seg-' + key,
            className: 'xjj-seg-b' + (usageRange === key ? ' on' : ''),
            onClick: (e) => { e.stopPropagation(); setUsageRange(key); },
          }, label);
          const u = usage || {};
          const totals = u.totals || {};
          const models = Array.isArray(u.byModel) ? u.byModel : [];
          const items = Array.isArray(u.items) ? u.items : [];
          const ret = u.retention || {};
          const maxM = models.reduce((m, x) => Math.max(m, Number(x.amount) || 0), 0) || 1;
          const modelRows = models.slice(0, 6).map((m, i) => {
            const amt = Number(m.amount) || 0;
            const share = Number(totals.amount) > 0 ? Math.round((amt / Number(totals.amount)) * 100) : 0;
            return h('div', {
              key: 'm' + i + String(m.model || ''),
              className: 'xjj-model',
              title: String(m.model || '') + ' · ' + (Number(m.turns) || 0) + ' 轮 · ' + fmtTokens(m.tokens) + ' tok',
            },
              h('div', { className: 'xjj-model-head' },
                h('span', { className: 'xjj-model-name' }, modelLabel(m.model)),
                h('span', { className: 'xjj-model-val' }, money(amt) + ' · ' + share + '%')),
              h('div', { className: 'xjj-model-track' },
                h('div', { className: 'xjj-model-fill', style: { width: Math.max(2, Math.round((amt / maxM) * 100)) + '%' } })));
          });
          return [
            h('div', { key: 'seg', className: 'xjj-seg' }, [segBtn('today', '今日'), segBtn('7d', '近 7 天'), segBtn('all', '全部')]),
            h('div', { key: 'sum', className: 'xjj-usage-sum' },
              h('b', null, money(totals.amount)),
              h('span', null, (Number(totals.turns) || 0) + ' 轮 · ' + fmtTokens(totals.tokens) + ' tok')),
            h('div', { key: 'search', className: 'xjj-search' },
              h('input', {
                className: 'xjj-search-in', type: 'search', value: usageQ, placeholder: '搜模型 / 日期 / 金额',
                onChange: (e) => setUsageQ(e.target.value),
                onPointerDown: (e) => e.stopPropagation(),
              })),
            h('div', { key: 'models', className: 'xjj-models' },
              modelRows.length ? modelRows : h('div', { className: 'xjj-empty' }, usage ? '这段时间还没有消耗' : '加载中…')),
            h('div', { key: 'list', className: 'xjj-list' },
              items.length
                ? items.map((t, i) => h('div', { key: 'i' + i + t.ts, className: 'xjj-item' },
                  h('span', { className: 'xjj-item-t' }, String(t.date || '').slice(5) + ' ' + String(t.time || '')),
                  h('span', { className: 'xjj-item-m' }, modelLabel(t.model) || '—'),
                  h('span', { className: 'xjj-item-v' }, money(t.amount))))
                : h('div', { className: 'xjj-empty' }, usageQ ? '没有匹配的明细' : '明细只留最近 500 条 / 90 天')),
            h('div', { key: 'ret', className: 'xjj-ret' },
              '明细 ' + (Number(ret.turnsLive) || 0) + '/' + (Number(ret.turnsCap) || 0) + ' 条 · 留 ' + (Number(ret.turnDays) || 0) + ' 天 · 逐日 ' + (Number(ret.dailyDays) || 0) + '/' + (Number(ret.dailyCap) || 0) + ' 天 · 归档 ' + (Number(ret.archived) || 0) + ' 条'),
          ];
        }
        if (menuTab === 'sound') {
          return [
            Row('音效', Sw(soundOn, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { on: !soundOn }); }))),
            Row('音量', h('input', {
              className: 'xjj-range', type: 'range', min: 0, max: 100, value: volume,
              onChange: (e) => setCfg(Object.assign({}, cfg, { sound: Object.assign({}, cfg.sound || {}, { volume: Number(e.target.value) / 100 }) })),
              onPointerUp: (e) => { e.stopPropagation(); setVol(Number(e.target.value) / 100); },
            }), volume + '%'),
            Row('按压音', Sw((cfg.sound || {}).press !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { press: !(n.sound && n.sound.press !== false) }); }))),
            Row('松开音', Sw((cfg.sound || {}).release !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { release: !(n.sound && n.sound.release !== false) }); }))),
            Row('气泡音', Sw((cfg.sound || {}).bubble !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { bubble: !(n.sound && n.sound.bubble !== false) }); }))),
            Row('面板音', Sw((cfg.sound || {}).panel !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { panel: !(n.sound && n.sound.panel !== false) }); }))),
            Row('法宝音', Sw((cfg.sound || {}).pick !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { pick: !(n.sound && n.sound.pick !== false) }); }))),
            Row('衣料音', Sw((cfg.sound || {}).cloth !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { cloth: !(n.sound && n.sound.cloth !== false) }); }))),
            Row('御剑风声', Sw((cfg.sound || {}).wind !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { wind: !(n.sound && n.sound.wind !== false) }); }))),
            Row('晚磬', Sw((cfg.sound || {}).bell !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { bell: !(n.sound && n.sound.bell !== false) }); }))),
            Row('提示音', Sw((cfg.sound || {}).alert !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { alert: !(n.sound && n.sound.alert !== false) }); }))),            Row('结束音', Sw((cfg.sound || {}).turn !== false, () => updateCfg((n) => { n.sound = Object.assign({}, n.sound || {}, { turn: !(n.sound && n.sound.turn !== false) }); }))),
          ];
        }
        if (menuTab === 'look') {
          return [
            // 主题只作用于挂件本身：不改 DSH 的 appearance，也不调 setTheme
            h('div', { className: 'xjj-row', key: 'theme' },
              h('span', { className: 'xjj-lbl' }, '主题'),
              h('div', { style: { display: 'flex', gap: 3, flex: '0 0 auto' } },
                [['auto', '跟随系统'], ['light', '白天'], ['dark', '黑夜']].map((o) => h('button', {
                  key: o[0],
                  className: 'xjj-seg-b' + (themePref === o[0] ? ' on' : ''),
                  style: SEG_MD,
                  onClick: (e) => {
                    e.stopPropagation();
                    updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { theme: o[0] }); });
                  },
                }, o[1])))),
            // 衣装：auto = 白天白衣、夜里黑衣；手动可强制
            h('div', { className: 'xjj-row', key: 'outfit' },
              h('span', { className: 'xjj-lbl' }, '衣装'),
              h('div', { style: { display: 'flex', gap: 3, flex: '0 0 auto' } },
                [['auto', '跟随主题'], ['ink', '黑衣'], ['white', '白衣']].map((o) => h('button', {
                  key: o[0],
                  className: 'xjj-seg-b' + (outfitPref === o[0] ? ' on' : ''),
                  style: SEG_MD,
                  onClick: (e) => {
                    e.stopPropagation();
                    updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { outfit: o[0] }); });
                  },
                }, o[1])))),
            // 背光颜色：auto = 跟衣装（黑衣紫 / 白衣红）
            h('div', { className: 'xjj-row', key: 'glow' },
              h('span', { className: 'xjj-lbl' }, '背光'),
              h('div', { style: { display: 'flex', gap: 2, flex: '1 1 auto', justifyContent: 'flex-end' } },
                [['auto', '跟随'], ['purple', '紫'], ['red', '红'], ['cyan', '青'], ['gold', '金'], ['none', '关']].map((o) => h('button', {
                  key: o[0],
                  className: 'xjj-seg-b' + (glowPref === o[0] ? ' on' : ''),
                  style: SEG_SM,
                  onClick: (e) => {
                    e.stopPropagation();
                    updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { glow: o[0] }); });
                  },
                }, o[1])))),
            // 背光强度
            h('div', { className: 'xjj-row', key: 'glowA' },
              h('span', { className: 'xjj-lbl' }, '背光强度'),
              h('div', { style: { display: 'flex', gap: 3, flex: '1 1 auto', justifyContent: 'flex-end' } },
                [[0.35, '淡'], [0.65, '中'], [0.9, '浓']].map((o) => h('button', {
                  key: String(o[0]),
                  className: 'xjj-seg-b' + (Math.abs(glowAlpha - o[0]) < 0.01 ? ' on' : ''),
                  style: SEG_MD,
                  onClick: (e) => {
                    e.stopPropagation();
                    updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { glowAlpha: o[0] }); });
                  },
                }, o[1])))),
            h('div', { className: 'xjj-tals-wrap', key: 'tals' },
              h('span', { className: 'xjj-lbl' }, '法宝'),
              h('div', { className: 'xjj-tals' },
                TALISMAN_ORDER.map((k) => h('button', {
                  key: k,
                  className: 'xjj-talpick' + ((pendingTal || talisman) === k ? ' on' : '') + (pendingTal === k && pendingTal !== talisman ? ' pending' : ''),
                  title: TALISMAN_NAMES[k] || k,
                  onClick: (e) => {
                    e.stopPropagation();
                    setPendingTal(k);
                  },
                }, h('img', {
                  src: TALISMANS[k], alt: '', draggable: false,
                  style: TALISMAN_FIT[k] ? { transform: 'scale(' + TALISMAN_FIT[k] + ')' } : undefined,
                })))),
              h('div', { className: 'xjj-tal-apply' },
                h('small', { className: 'xjj-tals-name' },
                  (pendingTal && pendingTal !== talisman ? '将换成：' : '当前：') + (TALISMAN_NAMES[pendingTal || talisman] || '青玉方印')),
                h('button', {
                  className: 'xjj-btn' + (pendingTal && pendingTal !== talisman ? '' : ' dim'),
                  onClick: (e) => {
                    e.stopPropagation();
                    if (!pendingTal || pendingTal === talisman) return;
                    playSfx('pick');
                    updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { talisman: pendingTal }); });
                    setPendingTal(null);
                  },
                }, '应用'))),
            Row('人物大小', Step(uiScale.toFixed(2) + '×',
              () => updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { scale: Math.max(0.7, Math.round((uiScale - 0.1) * 100) / 100) }); }),
              () => updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { scale: Math.min(1.6, Math.round((uiScale + 0.1) * 100) / 100) }); }))),
            Row('气泡停留', Step((Number(cfg.bubbleHoldSec) > 0 ? Number(cfg.bubbleHoldSec) : 3) + ' 秒',
              () => updateCfg((n) => { n.bubbleHoldSec = Math.max(3, (Number(n.bubbleHoldSec) || 3) - 1); }),
              () => updateCfg((n) => { n.bubbleHoldSec = Math.min(30, (Number(n.bubbleHoldSec) || 3) + 1); }))),
            Row('点击气泡', Sw(bubbleOn, () => updateCfg((n) => { n.bubbleOn = !bubbleOn; }))),
            Row('贴左自动镜像', Sw(((cfg.ui || {}).mirror !== false), () => updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { mirror: ((n.ui || {}).mirror === false) }); }))),
            Row('位置', Btn('回到右下角', () => {
              updateCfg((n) => { n.ui = Object.assign({}, n.ui || {}, { anchor: 'br', dx: 6, dy: 10, x: null, y: null }); });
              setMenuOpen(false);
            })),
          ];
        }
        if (menuTab === 'notice') {
          const everyMin = chatter.on === false ? 0 : (Number(chatter.everyMin) || 10);
          return [
              Row('余额告急', Sw(notice.lowBalance !== false, () => updateCfg((n) => { n.notice = Object.assign({}, n.notice || {}, { lowBalance: !(n.notice && n.notice.lowBalance !== false) }); }))),
            Row('每轮消耗', Sw(notice.turnCost !== false, () => updateCfg((n) => { n.notice = Object.assign({}, n.notice || {}, { turnCost: !(n.notice && n.notice.turnCost !== false) }); }))),
            Row('提问提醒', Sw(notice.askWait !== false, () => updateCfg((n) => { n.notice = Object.assign({}, n.notice || {}, { askWait: !(n.notice && n.notice.askWait !== false) }); })), '东家不在旁边也喊你一声'),
            Row('授权提醒', Sw(notice.approveWait !== false, () => updateCfg((n) => { n.notice = Object.assign({}, n.notice || {}, { approveWait: !(n.notice && n.notice.approveWait !== false) }); })), '要你点同意的那一刻'),
            (() => {
              const cap = Number((cfg.budget || {}).daily) || 0;
              // 2026-10-27：改成固定步长 5（0 → 5 → 10 → 15 … 上限 100），不再用 [0,5,10,20,50,100] 跳档。
              // 用函数式更新从最新 state 取当前值，快速连点不会丢步。
              const bump = (delta) => updateCfg((n) => {
                const cur = Number((n.budget || {}).daily) || 0;
                const next = Math.max(0, Math.min(100, cur + delta));
                n.budget = Object.assign({}, n.budget || {}, { daily: next });
              });
              return Row('今日预算', Step(cap ? '¥' + cap : '关',
                () => bump(-5),
                () => bump(5)), '到了冒一次泡');
            })(),
            Row('温馨提示', Sw(notice.wellness !== false, () => updateCfg((n) => {
              n.notice = Object.assign({}, n.notice || {}, { wellness: !(n.notice && n.notice.wellness !== false) });
            })), '喝水 / 歇眼 / 走动 / 吃饭'),
          Row('深夜劝睡', Sw(notice.lateNight !== false, () => updateCfg((n) => { n.notice = Object.assign({}, n.notice || {}, { lateNight: !(n.notice && n.notice.lateNight !== false) }); }))),
  Row('提示间隔', Step((Number((cfg.wellness || {}).everyMin) || 30) + ' 分钟',
  () => updateCfg((n) => { const w = n.wellness || {}; const cur = Math.round((Number(w.everyMin) || 30) / 10) * 10; n.wellness = Object.assign({}, w, { everyMin: Math.max(10, cur - 10) }); }),
  () => updateCfg((n) => { const w = n.wellness || {}; const cur = Math.round((Number(w.everyMin) || 30) / 10) * 10; n.wellness = Object.assign({}, w, { everyMin: Math.min(60, cur + 10) }); }))),
            Row('闲聊间隔', Step(everyMin ? everyMin + ' 分钟' : '关',
  () => updateCfg((n) => { const c = n.chatter || {}; const cur = Math.round((Number(c.everyMin) || 10) / 10) * 10; const next = Math.max(0, cur - 10); n.chatter = next ? Object.assign({}, c, { on: true, everyMin: Math.max(10, next) }) : Object.assign({}, c, { on: false, everyMin: cur || 10 }); }),
  () => updateCfg((n) => { const c = n.chatter || {}; const cur = Math.round((Number(c.everyMin) || 10) / 10) * 10; const base = cur > 0 ? cur : 0; n.chatter = Object.assign({}, c, { on: true, everyMin: Math.min(55, Math.max(10, base + 10)) }); }))),
          ];
        }
        return [
          Row('剑舞', Btn('舞一段', () => { setMenuOpen(false); playDance(); })),
          Row('御剑', Btn('飞一圈', () => { setMenuOpen(false); startFlight(); })),
          Row('动作', Btn('预览动作', parade)),
          Row('提示', Btn('提醒一句', () => { setMenuOpen(false); sayWellness(true); })),
          Row('气泡', Btn('可视化编辑', () => openEditor({ kind: 'first' }))),
          Row('配置', Btn('复制路径', () => {
            // 路径由宿主给（GET /xjj/config.json 的 path 字段）；网页版给 localStorage://…
            const p = cfgPathRef.current || '~/.dsh/.xjj-config.json';
            try { navigator.clipboard.writeText(p); } catch (err) {}
            setMenuOpen(false);
            showSpecial([{ style: { fontSize: 11.5 }, modules: [{ type: 'text', text: '路径已复制：' + p }] }], 6000);
          })),
          Row('自检', Btn('产物 / 构建', () => { setMenuOpen(false); showAbout(); })),
          Row('版本', h('b', { className: 'xjj-val', style: { color: 'var(--xjj-text-strong)' } }, 'v__XJJ_VERSION__')),
        ];
      })();

      // 面板在缩放容器里：所有尺寸除以 uiScale，才是画出来后的真实占位
      const rootTop = pos ? pos.y : Math.max(0, vp.h - 10 - 270);
      // 2026-10-25 修：面板已是 fixed 定位，位置只跟 root 顶部走；
      // 若把 yoOffset 再算进来，点「人物大小」时面板会跟着上下移动 → 鼠标指向的按钮跑掉 → 指针乱跳
      // 2026-10-26 修：人物放大后法宝按钮会往上跑（它在缩放容器里），面板还固定按 root 顶部排 → 压住按钮。
      // 改成量按钮的真实矩形当锚点：面板永远排在按钮上方，两者留 10px。
      const gearRect = gearRef.current ? gearRef.current.getBoundingClientRect() : null;
      // 开了面板就用「打开那一刻量到的锚点」，让面板在调大小/换页期间钉住不动；
      // 拖动人物、开面板、窗口尺寸变化时才重新取（见下面的 effect）。
      const liveGearTop = gearRect ? Math.round(gearRect.top) : (rootTop - 26);
      const gearTop = (menuOpen && panelAnchor.current) ? panelAnchor.current : liveGearTop;

      // 只在「开面板 / 拖人物 / 窗口变形」时重取锚点；**故意不监听 uiScale** ——
      // 调大小时锚点不动，面板就不会在鼠标底下往上蹿。
      React.useEffect(() => {
        if (!menuOpen) { panelAnchor.current = 0; return; }
        const g = gearRef.current;
        if (g) panelAnchor.current = Math.round(g.getBoundingClientRect().top);
      }, [menuOpen, pos && pos.x, pos && pos.y, vp.w, vp.h]);
      const gearH = gearRect ? Math.round(gearRect.height) : 64;
      // 顶部给宿主标题栏留位置：面板别再顶到窗口最上面压住「— □ ×」
      const TOP_SAFE = 64;
      const spaceAbove = Math.max(140, gearTop - 10 - TOP_SAFE);
      const spaceBelow = Math.max(140, vp.h - (gearTop + gearH) - 14);
      // 真的放不下才翻到下面（以前只看「上方不足 300」，面板高 400 时会被压到顶边）
      // 只有上方真的不够（<300）才翻到下面 —— 下方是人物本身，翻下去会把人盖住
      // 一律排在按钮上方：按钮下面就是人物，翻下去必然盖住人。放不下就变矮（内部滚动）。
      const flipDown = false;
      // 以「数据」页的内容高度作为面板基准高度（只量一次/变化时）
      // 实测标题栏 + 页签高度（写死会差几个像素，导致数据页出现滚动条）
      // 切换页签 / 重新打开时，内容区回到顶部（否则会停在上一页的滚动位置）
      React.useEffect(() => {
        if (!menuOpen) return;
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
      }, [menuOpen, menuTab]);

      React.useEffect(() => {
        if (!menuOpen) return;
        const hh = headRef.current ? headRef.current.offsetHeight : 0;
        const th = tabsRef.current ? tabsRef.current.offsetHeight : 0;
        const total = hh + th;
        if (total > 0 && Math.abs(total - chromeH) > 1) setChromeH(total);
      }, [menuOpen, menuTab, chromeH]);

      React.useEffect(() => {
        if (!menuOpen || menuTab !== 'data') return;
        const el = bodyRef.current;
        if (!el) return;
        const h = el.scrollHeight;
        if (Math.abs(h - dataBodyH) > 6) setDataBodyH(h);
      }, [menuOpen, menuTab, dataBodyH]);

      const panelW = Math.max(180, Math.min(272, vp.w - 28));
      const M = 12;
      const rootRect = rootRef.current ? rootRef.current.getBoundingClientRect() : null;
      const needH = chromeH + dataBodyH + 2;                       // 内容需要的整高（+2 边框）
      const wantH = Math.min(520, vp.h * 0.56, needH);
      // 竖向放得下就排在上方；放不下就排到人物左侧（横向一般都有空间），最后才缩短
      const roomLeft = rootRect ? Math.round(rootRect.left) - panelW - 10 : -1;
      const sideBySide = spaceAbove < Math.min(wantH, 260) && roomLeft >= M;
      const fitH = sideBySide ? Math.min(wantH, vp.h - TOP_SAFE - M) : Math.min(wantH, spaceAbove);
      const panelH = Math.max(120, Math.min(fitH, needH));
      // 2026-10-27 修：面板横向要跟着人物所在的半边走。
      // 以前无条件 vp.w - 14 - panelW —— 人物贴左（anchor 'bl'，或拖到 x<240）时，
      // 面板照样钉在窗口最右边，跟人隔了一整屏（他报的 bug）。
      // 只改横向：竖向（贴按钮上方 10px）不动。
      const charMid = rootRect ? (rootRect.left + rootRect.right) / 2 : vp.w;
      let px = sideBySide ? roomLeft : (charMid < vp.w / 2 ? 14 : (vp.w - 14 - panelW));
      let py = sideBySide
        ? Math.min(gearTop - 40, vp.h - panelH - M)
        : (gearTop - 10 - panelH);
      py = Math.max(TOP_SAFE, Math.min(py, vp.h - panelH - M));
      px = Math.max(M, Math.min(px, vp.w - panelW - M));
      const panelStyle = {
        position: 'fixed', left: Math.round(px) + 'px', top: Math.round(py) + 'px',
        right: 'auto', bottom: 'auto', width: panelW + 'px', height: panelH + 'px',
      };
      const at = panelAt;   // 不记位置：每次打开都回到默认
      if (at) {
        panelStyle.left = Math.round(Math.max(M, Math.min(at.x, vp.w - panelW - M))) + 'px';
        panelStyle.top = Math.round(Math.max(M, Math.min(at.y, vp.h - panelH - M))) + 'px';
      }
      const headTier = amountTier(state.balance, (cfg.warn || {}).balanceLow);
      const headWarnLow = Number((cfg.warn || {}).balanceLow) || 10;
      const menuNode = menuOpen ? h('div', { className: 'xjj-panel', key: 'menu', ref: menuRef, style: panelStyle, onClick: (e) => e.stopPropagation() },
        h('div', { className: 'xjj-head', key: 'head', ref: headRef, onPointerDown: onPanelDown, title: '按住这里可以拖动面板' },
          h('b', null, '青云剑仙'),
          h('span', {
            className: 'xjj-head-dot ' + (headTier || ''),
            title: '余额 ' + money(state.balance) + (headTier === 'is-critical'
              ? ' · 低于告急阈值 ¥' + headWarnLow
              : (headTier === 'is-low' ? ' · 低于 ¥' + HEAD_YELLOW_AT : '')),
          }),
          h('button', {
            className: 'xjj-head-about',
            title: '关于',
            onPointerDown: (e) => { e.stopPropagation(); e.preventDefault(); },
            onClick: (e) => { e.stopPropagation(); setAboutOpen(true); },
          }, '关于')),
        h('div', { className: 'xjj-tabs', ref: tabsRef },
          Tab('data', '数据'), Tab('ledger', '账本'), Tab('sound', '声音'), Tab('look', '外观'), Tab('notice', '提醒'), Tab('more', '更多')),
        h('div', { className: 'xjj-body', ref: bodyRef, style: menuTab === 'data' ? { overflowY: 'auto', overflowX: 'hidden' } : undefined }, rows),
      ) : null;

      // 气泡编辑器浮窗：整行排序 / 行内模块 / 行样式 / 常用行库
      let edNode = null;
      if (editor) {
        const lines = editor.lines || [];
        const cur = Math.max(0, Math.min(selLine, lines.length - 1));
        const line = lines[cur] || null;
        const mods = (line && Array.isArray(line.modules)) ? line.modules : [];
        const curMod = Math.max(0, Math.min(selMod, mods.length - 1));
        const mod = mods[curMod] || null;
        const qItem = editor.kind === 'queue' ? ((cfg.queue || [])[editor.qi] || {}) : null;
        const variants = (qItem && Array.isArray(qItem.variants)) ? qItem.variants : [];
        const lib = Array.isArray(cfg.lineLib) ? cfg.lineLib : [];
        const lineStyle = (line && line.style) || {};
        const setStyle = (patch) => edLine(cur, (l) => Object.assign({}, l, { style: Object.assign({}, l.style || {}, patch) }));
        const setMod = (patch) => edLine(cur, (l) => Object.assign({}, l, {
          modules: (l.modules || []).map((m, k) => (k === curMod ? Object.assign({}, m, patch) : m)),
        }));
        const modName = (MOD_TYPES.find((x) => x[0] === (mod && mod.type)) || [mod && mod.type, mod && mod.type || '模块'])[1];

        edNode = h('div', {
          className: 'xjj-ed', key: 'editor',
          onPointerDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(),
        },
          h('div', { className: 'xjj-ed-head' },
            h('span', null, '气泡编辑 · ' + String(editor.title || '')),
            h('div', { style: { display: 'flex', gap: 6, flex: 'none', alignItems: 'center' } },
              confirmReset
                ? h('span', { className: 'xjj-ed-confirm' },
                  h('span', null, '恢复默认？'),
                  h('button', { className: 'xjj-mini danger', onClick: () => resetCurrent() }, '确认'),
                  h('button', { className: 'xjj-mini', onClick: () => setConfirmReset(false) }, '取消'))
                : h('button', { className: 'xjj-mini', onClick: () => setConfirmReset(true) }, '恢复默认'),
              h('button', { className: 'xjj-mini', onClick: () => { setConfirmReset(false); setEditor(null); } }, '关闭'))),
          h('div', { className: 'xjj-ed-body' },
            h('div', { className: 'xjj-ed-row' },
              h('span', { className: 'xjj-ed-s' }, '目标'),
              h('button', { className: 'xjj-chip' + (editor.kind === 'first' ? ' on' : ''), onClick: () => openEditor({ kind: 'first' }) }, '首次'),
              (cfg.queue || []).map((it, i) => h('button', {
                key: 't' + i,
                className: 'xjj-chip' + (editor.kind === 'queue' && editor.qi === i ? ' on' : ''),
                title: String(it.title || it.id),
                onClick: () => openEditor({ kind: 'queue', qi: i, vi: 0 }),
              }, String(it.title || it.id || i + 1).slice(0, 5)))),
            variants.length > 1 ? h('div', { className: 'xjj-ed-row' },
              h('span', { className: 'xjj-ed-s' }, '变体'),
              variants.map((v, k) => h('button', {
                key: 'v' + k,
                className: 'xjj-chip' + (editor.vi === k ? ' on' : ''),
                onClick: () => openEditor({ kind: 'queue', qi: editor.qi, vi: k }),
              }, (k + 1) + '（权重' + (Number(v.weight) || 1) + '）'))) : null,
            lines.length ? lines.map((l, i) => h('div', {
              key: 'l' + i,
              className: 'xjj-ed-line' + (i === cur ? ' on' : ''),
              onClick: () => { setSelLine(i); setSelMod(0); },
            },
              h('div', { className: 'xjj-ed-row' },
                h('span', { className: 'xjj-ed-s' }, '行 ' + (i + 1)),
                h('button', {
                  className: 'xjj-mini', onClick: (e) => {
                    e.stopPropagation();
                    edLines((ls) => { const a = ls.slice(); const j = i - 1; if (j < 0) return a; const t = a[i]; a[i] = a[j]; a[j] = t; return a; });
                    setSelLine(Math.max(0, i - 1));
                  },
                }, '↑'),
                h('button', {
                  className: 'xjj-mini', onClick: (e) => {
                    e.stopPropagation();
                    edLines((ls) => { const a = ls.slice(); const j = i + 1; if (j >= a.length) return a; const t = a[i]; a[i] = a[j]; a[j] = t; return a; });
                    setSelLine(Math.min(lines.length - 1, i + 1));
                  },
                }, '↓'),
                h('button', {
                  className: 'xjj-mini danger', onClick: (e) => {
                    e.stopPropagation();
                    edLines((ls) => ls.filter((x, k) => k !== i));
                    setSelLine(0);
                    setSelMod(0);
                  },
                }, '✕')),
              h('div', { className: 'xjj-ed-mods' },
                (l.modules || []).map((m, k) => h('span', {
                  key: 'm' + k,
                  className: 'xjj-ed-mod' + (i === cur && k === curMod ? ' on' : ''),
                  title: modSummary(m),
                  onClick: (e) => { e.stopPropagation(); setSelLine(i); setSelMod(k); },
                }, modSummary(m))),
                (l.modules || []).length < MAX_MODS ? h('button', {
                  className: 'xjj-mini',
                  onClick: (e) => {
                    e.stopPropagation();
                    const at = (l.modules || []).length;
                    setSelLine(i);
                    setSelMod(at);
                    edLine(i, (x) => Object.assign({}, x, { modules: (x.modules || []).concat([newModule('text')]) }));
                  },
                }, '+模块') : null))) : h('div', { className: 'xjj-empty' }, '这个气泡还没有行'),
            lines.length < MAX_LINES ? h('div', { className: 'xjj-ed-row' },
              h('button', {
                className: 'xjj-mini',
                onClick: () => {
                  edLines((ls) => ls.concat([{ style: { fontSize: 12.5, color:'var(--xjj-bub-text)' }, modules: [{ type: 'text', text: '新的一行' }] }]));
                  setSelLine(lines.length);
                  setSelMod(0);
                },
              }, '+ 新行'),
              h('span', { className: 'xjj-ed-s' }, '最多 6 行 · 每行 6 模块')) : null,
            line && mod ? h('div', { className: 'xjj-ed-box' },
              h('div', { className: 'xjj-ed-row' },
                h('span', { className: 'xjj-ed-s' }, '模块 ' + (curMod + 1) + ' · ' + modName),
                h('button', { className: 'xjj-mini', onClick: () => setMod({ type: 'text', text: mod.text || '' }) }, '改成文本'),
                h('button', {
                  className: 'xjj-mini danger',
                  onClick: () => {
                    edLine(cur, (l) => Object.assign({}, l, { modules: (l.modules || []).filter((x, k) => k !== curMod) }));
                    setSelMod(0);
                  },
                }, '删模块')),
              mod.type === 'random'
                ? h('textarea', {
                  className: 'xjj-ed-ta',
                  value: (mod.items || []).map((x) => String(x.text || '')).join('\n'),
                  onChange: (e) => setMod({ items: e.target.value.split('\n').map((t) => ({ text: t.trim(), weight: 1 })).filter((x) => x.text) }),
                })
                : mod.type === 'image'
                  ? h('div', { className: 'xjj-ed-row' },
                    h('input', {
                      className: 'xjj-ed-in', style: { flex: '1 1 140px' }, value: mod.src || '', placeholder: 'https://…',
                      onChange: (e) => setMod({ src: e.target.value }),
                    }),
                    h('input', {
                      className: 'xjj-ed-in', type: 'number', style: { width: '58px' }, value: Number(mod.height) || 80,
                      onChange: (e) => setMod({ height: Math.max(20, Math.min(220, Number(e.target.value) || 80)) }),
                    }))
                  : mod.type === 'text'
                    ? h('input', { className: 'xjj-ed-in', value: mod.text || '', onChange: (e) => setMod({ text: e.target.value }) })
                    : h('input', {
                      className: 'xjj-ed-in', value: mod.fmt || '', placeholder: '{v} / {today} / {label} / {cd}',
                      onChange: (e) => setMod({ fmt: e.target.value }),
                    })) : null,
            line ? h('div', { className: 'xjj-ed-box' },
              h('div', { className: 'xjj-ed-row' },
                h('span', { className: 'xjj-ed-s' }, '行样式'),
                h('input', {
                  className: 'xjj-ed-in', type: 'number', style: { width: '62px' }, value: readableFont(lineStyle.fontSize),
                  onChange: (e) => setStyle({ fontSize: Math.max(MIN_BUBBLE_FONT, Math.min(28, Number(e.target.value) || MIN_BUBBLE_FONT)) }),
                }),
                h('input', {
                  className: 'xjj-ed-in', style: { width: '92px' }, value: String(lineStyle.color || ''), placeholder: '#FFFCF4',
                  onChange: (e) => setStyle({ color: e.target.value }),
                }),
                h('button', {
                  className: 'xjj-chip' + (Number(lineStyle.fontWeight) >= 600 ? ' on' : ''),
                  onClick: () => setStyle({ fontWeight: Number(lineStyle.fontWeight) >= 600 ? 400 : 700 }),
                }, 'B'),
                h('button', {
                  className: 'xjj-chip' + (lineStyle.fontStyle === 'italic' ? ' on' : ''),
                  onClick: () => setStyle({ fontStyle: lineStyle.fontStyle === 'italic' ? 'normal' : 'italic' }),
                }, 'I'),
                h('button', {
                  className: 'xjj-chip' + (lineStyle.textDecoration === 'underline' ? ' on' : ''),
                  onClick: () => setStyle({ textDecoration: lineStyle.textDecoration === 'underline' ? 'none' : 'underline' }),
                }, 'U')),
              h('div', { className: 'xjj-ed-row' },
                h('span', { className: 'xjj-ed-s' }, '常用行'),
                h('button', {
                  className: 'xjj-mini',
                  onClick: () => {
                    updateCfg((n) => { n.lineLib = (Array.isArray(n.lineLib) ? n.lineLib : []).concat([JSON.parse(JSON.stringify(line))]); });
                    showSpecial([{ style: { fontSize: 11.5 }, modules: [{ type: 'text', text: '这一行已存进常用行' }] }], 3000);
                  },
                }, '存这一行'),
                lib.map((l, k) => h('span', { key: 'lb' + k, className: 'xjj-ed-row' },
                  h('button', {
                    className: 'xjj-chip', title: '插入到末尾',
                    onClick: () => edLines((ls) => (ls.length < MAX_LINES ? ls.concat([JSON.parse(JSON.stringify(l))]) : ls)),
                  }, modSummary((l.modules || [])[0]) + '…'),
                  h('button', {
                    className: 'xjj-mini danger',
                    onClick: () => updateCfg((n) => { n.lineLib = (Array.isArray(n.lineLib) ? n.lineLib : []).filter((x, j) => j !== k); }),
                  }, '✕'))),
                !lib.length ? h('span', { className: 'xjj-ed-s' }, '还没有') : null)) : null),
          h('div', { className: 'xjj-ed-foot' },
            h('button', { className: 'xjj-btn', onClick: () => showSpecial(editor.lines || [], 9000) }, '预览'),
            h('button', { className: 'xjj-btn', onClick: () => setEditor(null) }, '取消'),
            h('button', { className: 'xjj-btn', onClick: saveEditor }, '保存')));
      }

      // 量「当前姿态的立绘」越出屏幕多少，整体挪回来多少。
      // 只在姿态/缩放/位置变化时算一次；平时不变 → 不会左右抖。
      //
      // 2026-10-27 修（贴左放大后人物跑出窗口）：
      //   `--xjx-shift` 写在缩放容器里，真实视觉位移 = shift × 倍率，**且贴左镜像时方向相反**。
      //   上一版把 shift 当成「视觉像素」直接加回去、也直接当结果写回去：
      //     · 去掉位移时加错方向 → 算出的「未位移边」是错的；
      //     · 贴左时每点一次倍率就往左多推一段（越修越远），最后整个人滑出左边。
      //   现在按「视觉位移 = shift × 倍率 × 镜像方向」换算，并由**未位移的真实边**直接解出目标 shift，
      //   不做增量叠加，所以不会越修越偏，也不需要靠反复重跑收敛。
      React.useEffect(() => {
        if (flying) return;   // 飞行中位置由逐帧夹取负责，这里不算（算了会跟路径打架）
        const st = stageRef.current;
        const img = st && st.querySelector('.xjj-sprite.is-on');
        if (!img) return;
        const r = img.getBoundingClientRect();
        const W = window.innerWidth;
        const k = uiScale * (mirror ? 1 : -1);        // 视觉位移 / shift（含倍率与镜像方向）
        if (!k) return;
        const curVis = spriteShift * k;               // 当前视觉位移（正 = 向右）
        const uL = r.left - curVis;                   // 去掉位移后的真实左右边
        const uR = r.right - curVis;
        let wantVis = 0;
        if (uR > W - 6) wantVis = (W - 6) - uR;       // 右边越界：往左挪（负）
        else if (uL < 6) wantVis = 6 - uL;            // 左边越界：往右挪（正）
        const next = wantVis / k;
        if (Math.abs(next - spriteShift) > 0.5) setSpriteShift(next);
      }, [pose, uiScale, pos, vp.w, vp.h, flying, mirror, spriteShift]);

      const rootStyle = pos

        ? { left: pos.x + 'px', top: pos.y + 'px', right: 'auto', bottom: 'auto' }
        // 静止时：人物放大后脚会压到屏幕底边（缩放原点在 92%，底部被放大推出去），
        // 按倍率补一点底边距，脚下留出余量，御剑飞行也才有地方拐弯（2026-10-26）
        : { bottom: (10 + Math.round(Math.max(0, uiScale - 1) * 22)) + 'px' };
      rootStyle['--xs'] = String(uiScale);
      rootStyle['--xm'] = mirror ? '-1' : '1';
      // 抬升量只有一个来源：gearLift()（内部读 src/layout.json 注入的 LAYOUT 与 hitboxes）
      rootStyle['--yo'] = gearLift(pose, uiScale) + 'px';
      // 背光：inline 变量优先级高于 CSS 类，关掉时直接把透明度压到 0
      rootStyle['--xjj-glow-a'] = glowPref === 'none' ? '0' : String(glowAlpha);
      rootStyle['--xjj-glow-rgb'] = glowRgb;
      // 法宝底边离 root 顶边的两个常数也走真源，别在 CSS 里再写一遍 15 / 2
      rootStyle['--gear-base'] = LAYOUT.gearBase + 'px';
      rootStyle['--gear-mb'] = LAYOUT.gearMargin + 'px';
      rootStyle['--xjx-shift'] = Math.round(spriteShift) + 'px';   // 缩放原点在脚上方 22px：头顶上升量 ≈ 222×(倍率-1)

      const stageStyle = { transformOrigin: '50% 92%' };
      return h('div', { className: 'xjj-root' + (mirror ? ' is-mirror' : '') + (leftSide ? ' is-left' : '') + (menuOpen ? ' menu-open' : '') + (lang === 'en' ? ' is-en' : '') + (isLight ? ' is-light' : '') + (useWhite ? ' is-w-robe' : ''), key: 'root', ref: rootRef, style: rootStyle, onContextMenu: toggleMenu, onDragStart: (e) => e.preventDefault() },
        h('style', { key: 'css', dangerouslySetInnerHTML: { __html: CSS } }),
        h('span', { className: 'xjj-mote', key: 'm0', style: { left: '24%', animationDelay: '0s' } }),
        h('span', { className: 'xjj-mote', key: 'm1', style: { left: '52%', animationDelay: '1.7s' } }),
        h('span', { className: 'xjj-mote', key: 'm2', style: { left: '74%', animationDelay: '3.3s' } }),
        bubbleNode,
        menuNode,
        edNode,
        aboutOpen ? h('div', {
          className: 'xjj-ed xjj-about', key: 'about',
          onPointerDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(),
        },
          h('div', { className: 'xjj-ed-head' },
            h('span', null, '青云剑仙'),
            h('button', { className: 'xjj-mini', onClick: () => setAboutOpen(false) }, '关闭')),
          h('div', { className: 'xjj-ed-body xjj-ab-body' },
            h('div', { className: 'xjj-ab-sub' }, '黑衣与白衣双衣装 · 中英双语 · DSH 桌面挂件', ' · v__XJJ_VERSION__'),
            h('p', { className: 'xjj-ab-lead' }, '常驻屏幕右下角：盯余额、记消耗，也会催你早点睡'),
            h('div', { className: 'xjj-ab-sec' }, '<能做什么>'),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '1'),
              h('div', { className: 'xjj-ab-key' }, '形象'),
              h('div', null, '23 个姿态 · 24 帧剑舞 · 黑衣/白衣随主题换 · 14 件法宝皮肤 · 10 路音效'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '2'),
              h('div', { className: 'xjj-ab-key' }, '气泡'),
              h('div', null, '点他说话，按队列轮播 · 每行字号、颜色、加粗都能在面板里现改'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '3'),
              h('div', { className: 'xjj-ab-key' }, '账本'),
              h('div', null, '余额 · 今日已用 · 今日轮数 · 最近一笔 · 近 7 天柱图',
                h('div', { className: 'xjj-ab-sub2' }, '按模型占比 · 逐条明细可搜')),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '4'),
              h('div', { className: 'xjj-ab-key' }, '提醒'),
              h('div', null, '余额告急 · 每轮消耗 · 提问与授权提醒 · 今日预算 · 深夜劝睡 · 喝水歇眼'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '5'),
              h('div', { className: 'xjj-ab-key' }, '桌面'),
              h('div', null, '拖动吸附四角 · 0.7–1.6 倍缩放 · 贴左自动镜像 · 位置重启不丢'),
            ),
            h('div', { className: 'xjj-ab-sec' }, '<好在哪里>'),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '1'),
              h('div', { className: 'xjj-ab-key' }, '全本地'),
              h('div', null, '不联网、不上传，配置只写在你电脑上'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '2'),
              h('div', { className: 'xjj-ab-key' }, '零 token'),
              h('div', null, '素材与文案全部内联，不占模型上下文'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '3'),
              h('div', { className: 'xjj-ab-key' }, '双载体'),
              h('div', null, '一个包，DSH 插件与浏览器脚本都能跑'),
            ),
            h('div', { className: 'xjj-ab-row' },
              h('div', { className: 'xjj-ab-no' }, '4'),
              h('div', { className: 'xjj-ab-key' }, '处处可改'),
              h('div', null, '衣装、背光、音效、气泡，面板里现改'),
            ),
            h('div', { className: 'xjj-ab-sec' }, '<怎么用>'),
            h('div', { className: 'xjj-ab-row no-key' },
              h('div', { className: 'xjj-ab-no' }, '1'),
              h('div', null, '右键人物，或点他头顶的法宝图标 → 开面板')),
            h('div', { className: 'xjj-ab-row no-key' },
              h('div', { className: 'xjj-ab-no' }, '2'),
              h('div', null, '3 秒内连点 5 下 → 御剑绕屏一圈')),
            h('div', { className: 'xjj-ab-row no-key' },
              h('div', { className: 'xjj-ab-no' }, '3'),
              h('div', null, '更多 → 可视化编辑 → 气泡想怎么改怎么改')),
            h('div', { className: 'xjj-ab-fine' }, 'MIT 许可 · 立绘与表情自制'),
            h('div', { className: 'xjj-ab-donate' },
              h('img', { className: 'xjj-ab-qr', src: '__DONATE_QR__', alt: '赞赏码', draggable: false }),
              h('div', { className: 'xjj-ab-ask' }, '微信扫一扫，赏本座一碗清茶'),
              h('div', { className: 'xjj-ab-fine' }, '打赏自愿，不换取任何功能，也不影响使用')))) : null,
        h('div', {
          key: 'stage',
          className: 'xjj-stage' + (flying ? ' is-flying' : ''), draggable: false,
          ref: stageRef,
          role: 'button',
          tabIndex: 0,
          'aria-label': tr('aria', '青云剑仙'),
          // 飞行时必须关掉 xjj-float：CSS 动画的 transform 优先级高于内联样式，不关就飞不动
          style: dragging
            ? Object.assign({}, stageStyle, { animation: 'none', cursor: 'grabbing' })
            : (flying ? Object.assign({}, stageStyle, { animation: 'none' }) : stageStyle),
          onPointerEnter: onEnter,
          onPointerLeave: onLeave,
          onPointerDown: onPointerDown,
          onPointerMove: onPointerMove,
          onPointerUp: onPointerUp,
        onPointerCancel: onPointerCancel,
        onLostPointerCapture: onPointerCancel,
          onClick: onClick,
          onKeyDown: onKeyDown,
        },
        h('div', { className: 'xjj-shadow', key: 'shadow' }),
        // 命中区：只覆盖立绘的不透明轮廓（构建时由 tools/make_hitboxes.py 量好），
        // 点在人物旁边的空白不再冒泡。stage 本身 pointer-events:none，事件靠冒泡回来。
        h('div', {
          key: 'hitwrap',
          className: 'xjj-hitwrap',
          style: { aspectRatio: String((HIT_BOX[pose] || HIT_BOX.idle || { ar: 0.4 }).ar) },
        }, h('div', {
          key: 'hit',
          className: 'xjj-hit',
          style: (() => {
            const b = (HIT_BOX[pose] || HIT_BOX.idle || { box: [0, 0, 1, 1] }).box;
            return { left: (b[0] * 100) + '%', top: (b[1] * 100) + '%', width: (b[2] * 100) + '%', height: (b[3] * 100) + '%' };
          })(),
        })),
        Object.keys(POSES).map(sprite),   // 用姿态表本身生成，避免清单漏项导致人物消失
        slash ? h('div', { key: 'slash' + slash, className: 'xjj-slash' }) : null,
        slash ? h('div', { key: 'slashb' + slash, className: 'xjj-slash b' }) : null,
        ),
        h('button', {
          key: 'gear',
          ref: gearRef,
          className: 'xjj-gear' + (menuOpen ? ' on' : ''),
          title: '青云剑仙的法宝 · 点我',
          onPointerDown: (e) => { e.stopPropagation(); e.preventDefault(); },
          onClick: (e) => { e.stopPropagation(); toggleMenu(e); },
        }, h('img', {
          className: 'xjj-tal',
          src: TALISMANS[talisman] || TALISMANS.seal,
          style: TALISMAN_FIT[talisman] ? { transform: 'scale(' + TALISMAN_FIT[talisman] + ')' } : undefined,
          alt: '',
          draggable: false,
        })),
      );
    }

    return {
      inject: ['slots', 'locale', 'theme'],
      apply(ctx) {
        // 语言：DSH 的语言服务是 LocaleFace（getSnapshot().active），没有就依次退到
        // getLocale()、<html lang>、navigator.language。
        // 必须最先执行：下面所有中文字面量在构建时被包成 __xjjT(...)，按这里的语言查表。
        function readLang() {
          const norm = (id) => (String(id || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh');
          try {
            const loc = ctx.locale;
            const snap = loc && typeof loc.getSnapshot === 'function' ? loc.getSnapshot() : null;
            const id = snap && (snap.active || snap.locale || snap.id);
            if (typeof id === 'string' && id) return norm(id);
          } catch (error) { /* 下一个来源 */ }
          try {
            const legacy = ctx.locale && typeof ctx.locale.getLocale === 'function' ? ctx.locale.getLocale() : null;
            const id = legacy && (legacy.id || legacy.locale);
            if (typeof id === 'string' && id) return norm(id);
          } catch (error) { /* 下一个来源 */ }
          try {
            const htmlLang = document.documentElement && document.documentElement.lang;
            if (htmlLang) return norm(htmlLang);
          } catch (error) { /* 下一个来源 */ }
          try {
            const nav = navigator.language || (navigator.languages && navigator.languages[0]);
            if (nav) return norm(nav);
          } catch (error) { /* 兜底 */ }
          return 'zh';
        }

        // 明暗：读 DSH 主题快照的 active.colorScheme（'light' | 'dark'）。
        // preference 可能是 'system'，所以不能直接看 preference——active 才是实际生效的那套。
        // 老宿主没有 theme 服务时退到 prefers-color-scheme，再退到深色（现有默认）。
        function readScheme() {
          try {
            const snap = ctx.theme && typeof ctx.theme.getTheme === 'function' ? ctx.theme.getTheme() : null;
            const cs = snap && snap.active && snap.active.colorScheme;
            if (cs === 'light' || cs === 'dark') return cs;
          } catch (error) { /* 下一个来源 */ }
          try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
          } catch (error) { /* 兜底 */ }
          return 'dark';
        }

        let lang = readLang();
        try {
          if (window.__XJJ_I18N && typeof window.__XJJ_I18N.setLang === 'function') window.__XJJ_I18N.setLang(lang);
        } catch (error) { /* 没有预置脚本时退回中文 */ }

        const dict = { zh: { aria: '青云剑仙' }, en: { aria: 'XuanShuang' } };
        ctx.effect(() => ctx.locale.register(NS, 'zh', dict.zh));
        ctx.effect(() => ctx.locale.register(NS, 'en', dict.en));

        const t = ctx.locale.bind(NS);
        const tr = (key, fb) => {
          try {
            const value = t(key);
            return typeof value === 'string' && value ? value : fb;
          } catch (error) { return fb; }
        };

        // 宿主切语言 / 切外观时立刻跟着换（不用刷新）
        const WidgetHost = () => {
          const [langNow, setLangNow] = React.useState(lang);
          const [scheme, setScheme] = React.useState(readScheme);
          React.useEffect(() => {
            const sync = () => {
              const next = readLang();
              try {
                if (window.__XJJ_I18N && typeof window.__XJJ_I18N.setLang === 'function') window.__XJJ_I18N.setLang(next);
              } catch (error) { /* 忽略 */ }
              setLangNow(next);
            };
            sync();
            let off = null;
            try {
              if (ctx.locale && typeof ctx.locale.subscribe === 'function') off = ctx.locale.subscribe(sync);
            } catch (error) { /* 老宿主没有订阅 */ }
            return () => { if (typeof off === 'function') off(); };
          }, []);
          React.useEffect(() => {
            const syncScheme = () => setScheme(readScheme());
            syncScheme();
            let off = null;
            try {
              if (typeof ctx.on === 'function') off = ctx.on('theme/change', syncScheme);
            } catch (error) { /* 老宿主没有主题事件 */ }
            return () => { if (typeof off === 'function') off(); };
          }, []);
          return h(Widget, { tr: tr, lang: langNow, scheme: scheme });
        };
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'jianxian-widget',
          order: 40,
        }, WidgetHost));
      },
    };
  },
});











