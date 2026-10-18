export interface Formula {
  id: string
  name: string
  notation: string
  desc: string
}

export interface Stage {
  id: string
  title: string
  goal: string
  formulas: Formula[]
}

export interface Curriculum {
  order: number
  label: string
  intro: string
  stages: Stage[]
}

export const CURRICULA: Record<number, Curriculum> = {
  3: {
    order: 3,
    label: '三阶',
    intro: '层先法（Beginner Method）：从底层十字开始，一层一层往上还原，只需记住 7 组公式。',
    stages: [
      {
        id: 's1',
        title: '第一步 · 底层十字',
        goal: '把 4 个白色棱块转到白色中心周围，形成白色十字，且侧面颜色与中心块对齐。',
        formulas: [
          {
            id: '3-1-1',
            name: '棱块上顶',
            notation: "F R U R' U' F'",
            desc: '这一步没有固定公式，靠自己理解。先用 R / F / U 等转动把白棱转到顶层，再转到正确位置。',
          },
          {
            id: '3-1-2',
            name: '侧面复位',
            notation: 'R U R\' U\'',
            desc: 'Sexy Move：最基础的手法，反复练习形成肌肉记忆，后面很多公式都用到它。',
          },
        ],
      },
      {
        id: 's2',
        title: '第二步 · 底层角块',
        goal: '把 4 个白角块送到底层，完成第一层（白色面）。',
        formulas: [
          {
            id: '3-2-1',
            name: '右手角归位',
            notation: "R' D' R D",
            desc: '把目标角块放在右前上角，重复此公式直到该角块归位。',
          },
          {
            id: '3-2-2',
            name: '左手角归位',
            notation: "L D L' D'",
            desc: '右手公式的镜像，把目标角块放在左前上角时使用。',
          },
        ],
      },
      {
        id: 's3',
        title: '第三步 · 中间层棱块',
        goal: '把中间层的 4 个棱块归位，完成前两层（F2L）。',
        formulas: [
          {
            id: '3-3-1',
            name: '棱块去右手',
            notation: "U R U' R' U' F' U F",
            desc: '顶层棱块的侧面颜色与右面中心一致时使用，把它送进右中层。',
          },
          {
            id: '3-3-2',
            name: '棱块去左手',
            notation: "U' L' U L U F U' F'",
            desc: '与上式镜像，侧面颜色与左面中心一致时使用。',
          },
        ],
      },
      {
        id: 's4',
        title: '第四步 · 顶层十字',
        goal: '让顶层出现黄色十字（只看形状，先不管侧面）。',
        formulas: [
          {
            id: '3-4-1',
            name: '点 → 拐 → 一 → 十',
            notation: "F R U R' U' F'",
            desc: '经典十字公式。从"点"开始，每次把拐角放在左下角，重复即可依次得到拐角、一字、十字。',
          },
        ],
      },
      {
        id: 's5',
        title: '第五步 · 顶面全黄',
        goal: '让整个顶面变成黄色（OLL）。',
        formulas: [
          {
            id: '3-5-1',
            name: '小鱼公式（右手）',
            notation: "R U R' U R U2 R'",
            desc: '顶层出现"小鱼"形状（一个黄色角块在左前）时使用，鱼头朝左前方。',
          },
          {
            id: '3-5-2',
            name: '小鱼公式（左手）',
            notation: "R' U' R U' R' U2 R",
            desc: '小鱼的镜像情况，鱼头朝右前方时使用。',
          },
          {
            id: '3-5-3',
            name: '十字翻角',
            notation: "R U2 R' U' R U' R'",
            desc: '顶层是十字但角块朝向不对时的常用翻角公式。',
          },
        ],
      },
      {
        id: 's6',
        title: '第六步 · 顶角归位',
        goal: '让 4 个顶角块回到正确的位置（位置对了，颜色就对了）。',
        formulas: [
          {
            id: '3-6-1',
            name: '顶角三角换',
            notation: "x R' U R' D2 R U' R' D2 R2 x'",
            desc: 'A-perm：三个角块轮换。找到已经归位的角放在左前，做一次或两次即可四角归位。',
          },
          {
            id: '3-6-2',
            name: 'Sledgehammer',
            notation: "R' F R F'",
            desc: '常用辅助手法，配合 U 转动可以调整角块位置，建议单独练熟。',
          },
        ],
      },
      {
        id: 's7',
        title: '第七步 · 顶棱归位',
        goal: '最后调整顶层 4 个棱块的位置，魔方复原完成。',
        formulas: [
          {
            id: '3-7-1',
            name: '三棱换（逆时针）',
            notation: "R2 U R U R' U' R' U' R' U R'",
            desc: 'Ub-perm：三个棱块逆时针轮换。把已归位的棱放在前面，做一次或两次。',
          },
          {
            id: '3-7-2',
            name: '三棱换（顺时针）',
            notation: "R U' R U R U R U' R' U' R2",
            desc: 'Ua-perm：三个棱块顺时针轮换，与上式方向相反。',
          },
          {
            id: '3-7-3',
            name: '对棱互换',
            notation: "M2 U M2 U2 M2 U M2",
            desc: 'H-perm：交换两组相对棱块。注意 M 为中层，仅三阶可用。',
          },
        ],
      },
    ],
  },

  4: {
    order: 4,
    label: '四阶',
    intro: '降阶法：先把 6 个中心块拼好、12 组棱块合并，当成三阶来解，最后处理两个特殊情况。',
    stages: [
      {
        id: '4-s1',
        title: '第一步 · 合并中心块',
        goal: '每面拼出 2x2 的同色中心块，共 6 个面。',
        formulas: [
          {
            id: '4-1-1',
            name: '宽转搬运',
            notation: "Rw U Rw'",
            desc: '用宽转 Rw / Uw 把同色中心块一片片搬到位，注意不要破坏已拼好的中心。',
          },
          {
            id: '4-1-2',
            name: '顶层补心',
            notation: "Uw Rw Uw' Rw'",
            desc: '把顶层缺少的中心块补进侧面，是合并中心最常用的组合手法。',
          },
        ],
      },
      {
        id: '4-s2',
        title: '第二步 · 合并棱块',
        goal: '把 24 个棱块两两配对，合并成 12 组"大棱"。',
        formulas: [
          {
            id: '4-2-1',
            name: '翻棱（单层翻转）',
            notation: "Rw U R' U' Rw'",
            desc: '把需要翻转的一对棱放在 UF 位，执行后该组棱完成配对。',
          },
          {
            id: '4-2-2',
            name: '三棱轮换配对',
            notation: "Uw' R U R' F R' F' R Uw",
            desc: '把分散的棱块通过 Uw 装配送到位，中间的 R U R\' F R\' F\' R 是经典三棱换。',
          },
        ],
      },
      {
        id: '4-s3',
        title: '第三步 · 按三阶还原',
        goal: '完成降阶后，完全按三阶层先法还原（只转外层，避免打散棱组）。',
        formulas: [
          {
            id: '4-3-1',
            name: 'Sexy Move',
            notation: "R U R' U'",
            desc: '最常用手法，四阶段同样适用，注意不要用宽转以免拆开已合并的棱。',
          },
          {
            id: '4-3-2',
            name: '顶层十字',
            notation: "F R U R' U' F'",
            desc: '同三阶，得到顶层十字后按三阶流程继续。',
          },
        ],
      },
      {
        id: '4-s4',
        title: '第四步 · 特殊情况（Parity）',
        goal: '四阶独有的两种奇偶校验，是新手最容易卡住的地方。',
        formulas: [
          {
            id: '4-4-1',
            name: '单棱翻转（OLL Parity）',
            notation: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
            desc: '三阶不会出现的情况：只剩一组棱是反的。执行此公式后回到三阶 OLL 状态。',
          },
          {
            id: '4-4-2',
            name: '两棱互换（PLL Parity）',
            notation: "2R2 U2 2R2 Uw2 2R2 Uw2",
            desc: '最后两组棱需要互换时使用。2R 表示从右数第 2 层（内层）。',
          },
        ],
      },
    ],
  },

  5: {
    order: 5,
    label: '五阶',
    intro: '同样是降阶法：先拼 3x3 的中心、合并 3 片棱，再按三阶还原。五阶有真正的中层，可用 3Rw 三层宽转。',
    stages: [
      {
        id: '5-s1',
        title: '第一步 · 合并中心块',
        goal: '每面拼出 3x3 的同色中心（先拼中间的十字，再补 4 个角）。',
        formulas: [
          {
            id: '5-1-1',
            name: '三层宽转搬运',
            notation: "3Rw U 3Rw'",
            desc: '五阶最有力的工具：3Rw 一次带动三层，可以快速把中心块搬运到位。',
          },
          {
            id: '5-1-2',
            name: '中心补角',
            notation: "Rw U Rw' F' U' F",
            desc: '中心十字完成后，用宽转把剩下的 4 个中心角块补进去。',
          },
        ],
      },
      {
        id: '5-s2',
        title: '第二步 · 合并棱块',
        goal: '把每组的 3 片棱合并成一条"大棱"，共 12 组。',
        formulas: [
          {
            id: '5-2-1',
            name: '三片棱合并',
            notation: "Rw U R' U' Rw'",
            desc: '把两片同色棱放在 UF / UB 位，执行后合并为一组，是最常用的合并手法。',
          },
          {
            id: '5-2-2',
            name: '中层取棱',
            notation: "2R U R' U' 2R'",
            desc: '2R 只转第 2 层，可以把中间的棱片送到外层，便于配对。',
          },
        ],
      },
      {
        id: '5-s3',
        title: '第三步 · 按三阶还原',
        goal: '降阶完成后按三阶层先法还原，只转外层。',
        formulas: [
          {
            id: '5-3-1',
            name: '底层角块',
            notation: "R' D' R D",
            desc: '与三阶完全一致，把角块送到底层。',
          },
          {
            id: '5-3-2',
            name: '顶层十字',
            notation: "F R U R' U' F'",
            desc: '与三阶一致，重复可依次得到点 → 拐 → 一 → 十。',
          },
          {
            id: '5-3-3',
            name: '小鱼公式',
            notation: "R U R' U R U2 R'",
            desc: '与三阶一致，用于完成顶面同色。',
          },
        ],
      },
      {
        id: '5-s4',
        title: '第四步 · 特殊情况',
        goal: '五阶同样会遇到棱块奇偶问题，处理方式与四阶一致。',
        formulas: [
          {
            id: '5-4-1',
            name: '单棱翻转（OLL Parity）',
            notation: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
            desc: '只剩一组棱反了时使用，与四阶公式相同。',
          },
          {
            id: '5-4-2',
            name: '两棱互换（PLL Parity）',
            notation: "2R2 U2 2R2 Uw2 2R2 Uw2",
            desc: '最后两组棱互换时使用。',
          },
        ],
      },
    ],
  },
}

/** 记号速查表 */
export const NOTATION_HELP: { token: string; desc: string }[] = [
  { token: 'R L U D F B', desc: '右 左 上 下 前 后，各自顺时针转 90°（从该面外侧看）' },
  { token: "R'", desc: '加撇号 = 逆时针转 90°' },
  { token: 'R2', desc: '加 2 = 转 180°，方向无所谓' },
  { token: 'M E S', desc: '中层：M 跟随 L，E 跟随 D，S 跟随 F（仅奇数阶）' },
  { token: 'Rw Uw Fw', desc: '宽转：同时带动最外两层，大阶数常用' },
  { token: '3Rw', desc: '三层宽转：同时带动最外三层（五阶）' },
  { token: '2R', desc: '单片内层：只转从右数第 2 层' },
  { token: 'x y z', desc: '整体转魔方：x 同 R，y 同 U，z 同 F' },
]
