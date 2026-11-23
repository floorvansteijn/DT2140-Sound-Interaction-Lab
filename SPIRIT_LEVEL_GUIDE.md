# Interaction 3 — Audio Spirit Level

This interaction uses the repository's existing `brass.wasm`, `dsp.js`, `helpers.js` and p5 shell. Its changes are separate from interactions 1 and 2.

## Run / 运行

Serve the repository with `python3 -m http.server 8874 --bind 127.0.0.1`, then open `http://127.0.0.1:8874/sound3.html` on the same computer.

在仓库目录启动上述服务器，电脑打开上述地址。手机需要访问部署后的 HTTPS 页面；手机上的 localhost 指向手机本身，不是电脑。

## Phone test / 手机测试

1. Open the deployed `sound3.html` page in the phone browser. Disable desktop simulation.
   手机打开部署后的第三页，保持电脑模拟关闭。
2. Start at low volume. Select **Turn On DSP**, then **Enable phone sensors** and allow motion/orientation access.
   先调低音量，打开 DSP，再启用手机传感器并授权。
3. Place the phone flat, screen facing up, on a known level surface. Expect an angle near 0°, a green **LEVEL** state and silence.
   手机屏幕朝上放在已知水平的平面，预期角度接近 0°、显示绿色 LEVEL、没有提示音。
4. Slowly lift one edge, then test a different edge. Expect increasing inclination and faster brass pulses for steeper slopes.
   分别缓慢抬高不同的边，观察角度增加，并听到随倾斜程度加快的铜管提示音。
5. Return to horizontal. The sound should stop. Turn DSP off and confirm sound also stops while tilted.
   放回水平后声音应停止；保持倾斜时关闭 DSP，声音也应停止。

Do not enable desktop simulation for the actual phone demonstration. Sensor availability and permission must be tested on the physical phone; a desktop simulation is not proof of that test.

## Computer test / 电脑模拟

Expand **Computer test controls**, enable **Use desktop simulation**, and adjust Tilt X or Tilt Y. Select **Turn On DSP** to hear the feedback. Both controls at 0° should be silent. For example, one axis at 30° should settle at 30°; both axes at 45° should settle at 60°.

打开电脑测试控件并勾选模拟，移动两个滑块。它们代替手机角度输入，其他角度计算和声音逻辑相同。两个值为 0° 时安静；单轴 30° 应显示约 30°；双轴 45° 应显示约 60°。

## Implementation / 代码说明

- `level-model.js`: calculates the surface inclination from the two orientation angles, applies level tolerance and produces bounded feedback settings.
- `interaction-3.js`: reads phone orientation or explicit simulation input, smooths small changes, loads the existing Faust brass model, and schedules short gain envelopes.
- `sound3.html`, `spirit-level.css`: the third interaction's controls and scoped presentation.
- `level-model.test.cjs`: geometry, invalid readings, hysteresis and feedback bounds.

The inclination is the acute angle between the phone's plane and horizontal, 0–90°. Screen-down horizontal is also horizontal. This is a demonstration, not a calibrated measuring instrument. Enter level at 2° or less and leave it above 3°; this hysteresis prevents boundary chatter. Smoothing means the displayed value takes a short moment to settle after a sudden change.

水平判定有容差：降到 2°以内进入 LEVEL，超过 3°才离开 LEVEL。短暂平滑能减少手抖造成的跳变；突然改变角度后，显示会稍后稳定。它不是经过校准的专业测量仪器。

## Merge / 合并

The implementation only changes the third interaction and adds its own model, stylesheet, tests and this guide. Merge the feature branch through GitHub after reviewing it with your partner. Publish from the normal Pages branch, wait for deployment, and reload the phone. Saving local files alone does not update the public website.

第三项在独立分支上；与搭档核对后合并，再等待 Pages 部署。没有自动更改共同 main 分支或代交 Canvas。

## Verification and AI assistance

The automated geometry/feedback tests and desktop browser checks are separate from the physical phone test. The latter remains pending until the students carry it out. Code and documentation were prepared with Codex assistance. The [course AI guidelines](https://canvas.kth.se/courses/65628/pages/use-of-generative-ai-in-the-course) restrict AI-generated assessed work; this assistance must not be misrepresented as unaided student work, and any assessed use must follow the course's instructions.
