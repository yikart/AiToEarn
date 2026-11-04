# Request examples

These are business request objects, not submission envelopes. Follow `mcp.md` for argument mapping. Replace placeholder URLs with actual accessible assets before submission. Use the selected interface’s existing authentication for preset voice examples.

These illustrate prompt construction, not tested audio outcomes or universal voice defaults. Prefer text descriptions when no specific identity is required; use `voices.md` when a preset or recording is needed. Omit a speech duration when the brief has none. Omit speed, pitch, and loudness controls without a concrete basis for their values.

## Chinese narration with word timestamps

```json
{
  "model": "seed-audio-1.0",
  "text_prompt": "用清晰柔和、气声少的普通话声音欢迎刚到森林小屋的客人。语气亲近、放松，节奏舒缓，第一句是迎接，第二句轻轻邀请对方留意周围；按意思连贯地说，在两句之间留自然停顿。准确说出以下台词，不增删文字：‘欢迎来到森林小屋。放慢脚步，听听风穿过树叶的声音。’只输出人声，无音乐、环境音。",
  "audio_config": {"format": "mp3", "sample_rate": 44100, "enable_subtitle": true}
}
```

## Two speakers

This example assumes these two presets are already selected for character continuity; two speakers alone do not require preset IDs.

```json
{
  "model": "seed-audio-1.0",
  "text_prompt": "生成中文双人对话。出发前，@音频1向同伴确认：‘准备好了吗？’@音频2听完后带着期待回应：‘准备好了，我们出发！’两人语气轻松，第二句承接第一句。准确说出各自引号内的台词，不增删文字，无旁白、音乐或环境音。",
  "references": [{"speaker": "zh_female_xiaohe_uranus_bigtts"}, {"speaker": "zh_male_taocheng_uranus_bigtts"}],
  "audio_config": {"format": "wav", "sample_rate": 48000}
}
```

## Sound effect, no voice reference

```json
{
  "model": "seed-audio-1.0",
  "text_prompt": "生成约3秒的游戏奖励音效：开头清脆的金属叮声，随后三颗水晶依次发出升调音，结尾短促柔和地消散。清晰干净，无人声，无背景音乐，无环境底噪。",
  "audio_config": {"format": "wav", "sample_rate": 48000}
}
```

## Reference recording

```json
{
  "model": "seed-audio-1.0",
  "text_prompt": "Use @音频1 as the voice identity reference. Deliver a clear, measured station announcement for waiting passengers, with light emphasis on the arrival time. Speak exactly: ‘The next train arrives in five minutes.’ Output speech only, without music or ambient sound; do not reproduce the reference recording's words or background sounds.",
  "references": [{"audio_url": "https://example.com/reference.mp3"}],
  "audio_config": {"format": "mp3", "sample_rate": 44100}
}
```

For a local recording, inspect size and duration, then obtain an accessible HTTP(S) URL through an authorized upload/hosting route. Do not send `audio_data`, Base64 or data URLs as model business parameters.

## Other speech contexts

The following are `text_prompt` examples after one compatible voice has been selected and bound as `@音频1`. They use the same business request structure above; no extra emotion or context fields are needed.

- **Personal account:** `使用@音频1，用普通话向朋友讲述一次找钥匙的经历。开头平静交代寻找经过，说到“原来一直在我手里”时略显惊讶，最后带一点释然。准确说出：‘我找遍了外套和背包，还是没找到钥匙。低头一看，原来一直在我手里。这下终于能出门了。’不增删台词，只输出人声。`
- **Service reply:** `使用@音频1，用普通话回应担心操作出错的用户。语气耐心、平稳，先让对方安心，再清楚交代下一步。准确说出：‘别着急，刚才的内容已经保存了。点击右上角，就能继续编辑。’不增删台词，只输出人声。`
- **Explanation:** `使用@音频1，用普通话给第一次接触剪辑的人解释区别。表达清楚、有交流感，重点落在两种操作的区别上。准确说出：‘裁剪改变的是画面范围，缩放改变的是画面大小。它们不是一回事。’不增删台词，只输出人声。`
- **Advertising:** `使用@音频1，用普通话为一款轻便雨伞配音。像向有通勤需求的人推荐实用物品，语气明快而克制，轻轻突出便携性。准确说出：‘放进包里，轻松出门。下雨的时候，它就在手边。’不增删台词，只输出人声。`
- **Audiobook:** `使用@音频1，用普通话讲述悬疑故事。叙述者保持沉着，在发现异常时稍放慢，让最后一句的信息自然落下。准确说出：‘他推开门，屋里没有人。可桌上的茶，还是热的。’不增删台词，只输出人声。`

## Dramatic scene with evolving delivery and sound

This excerpt illustrates sound-script writing only; reference selection and binding follow the existing rules separately. It assumes the user requested a suspenseful two-character scene with ambience, music, and a sound ending. The character names label turns and are not spoken narration.

```text
先是一声手机震动，背景中持续有轻微雨声。低音弦乐缓慢铺底，营造紧张感，音量低于对白。
林舟压低声音，带着怀疑问道：“你为什么现在才告诉我？”
陈远平静但有些迟疑地解释：“我以为，只要不开口，这件事就会过去。”
林舟听后语气变得急切，追问：“可他们已经找到这里了。你还在等什么？”
陈远不再回避，以告诫的口吻说：“听我说，别走正门。带上信，从后院离开。”
林舟短促地问：“那你呢？”
陈远语气放缓，带着无奈回应：“我留下。总得有人把这件事说清楚。”
最后一句结束后，响起椅子挪动的声音，随后是一阵逐渐远去的脚步声，雨声持续。准确说出引号内的台词，不朗读人物名称或表演说明。
```

## Image-conditioned speech

```json
{
  "model": "seed-audio-1.0",
  "text_prompt": "欢迎来到我的小小实验室，今天我们一起发现新的秘密。",
  "references": [{"image_url": "https://example.com/character.png"}],
  "audio_config": {"format": "mp3", "sample_rate": 44100}
}
```

For a local image, obtain an accessible HTTP(S) URL through an authorized upload/hosting route. Do not send `image_data`, Base64 or data URLs as model business parameters. Keep this mode free of audio/speaker references and production directions in the prompt.
