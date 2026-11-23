# Interaction 3 — Audio Spirit Level (original course page)

This version keeps the course's original HTML layout, styles.css, sketch.js, Turn On DSP button, sensor values, movement labels and threshold sliders. The level calculation and sound mapping live in interaction-3.js and level-model.js.

## Phone operation / 手机操作

1. Open the deployed sound3.html page in your phone browser and wait a few seconds for the brass model to load.
   手机打开部署后的第三页，等待几秒让铜管声音模型加载。
2. Start at low media volume, disable silent mode, and press Turn On DSP. Confirm that it changes to Turn Off DSP. Allow motion/orientation access when requested.
   调低媒体音量、关闭静音，点击原版 Turn On DSP，确认变为 Turn Off DSP，并允许运动/方向权限。
3. Tilt the phone gently. The original Rotation X/Y/Z values should change. The original description box also shows the calculated surface inclination and LEVEL/TILTED state.
   轻轻倾斜手机，原版 Rotation 数值应变化；下方原版说明框会显示倾角和 LEVEL/TILTED 状态。
4. Place the phone screen up on a known horizontal surface. It should settle near 0°, show LEVEL and remain silent.
   手机屏幕朝上放在已知水平的平面，预期接近0°、显示LEVEL并保持安静。
5. Slowly lift different edges. A larger inclination produces faster brass pulses. Return to horizontal and confirm silence.
   分别缓慢抬高不同的边；倾斜越大，铜管提示音越密。放回水平后应安静。
6. Press Turn Off DSP to stop the audio. Keep the page in the foreground during demonstration. If audio does not recover after locking or switching apps, reload and enable DSP again.
   点击 Turn Off DSP 停止声音。演示时保持网页前台；锁屏或切换应用后若无声，刷新再开启DSP。

The original shake/move sliders still control the course's movement indicators. They do not set this interaction's level tolerance.
原版 shake/move 滑块仍用于原版动作指示；水平仪的容差不由这两个滑块控制。

## Mapping / 映射

- Standard phone beta/gamma orientation angles produce the acute 0–90° angle between the phone's plane and horizontal.
- A short smoothing step reduces hand jitter. Enter LEVEL at 2° or less, and leave it above 3°.
- LEVEL is silent. Increasing inclination increases brass blowing pressure and pulse frequency; the output gain is bounded.
- Touching or shaking does not independently trigger the level's sound.

使用方向角计算相对水平面的倾角；平滑减少手抖。2°以内进入LEVEL，超过3°才离开。LEVEL安静；越倾斜，提示音越密。触摸或摇晃不会单独触发水平仪声音。

## Verification and assistance

Geometry and feedback tests pass; desktop loading and DSP startup are checked separately from physical phone validation. The students still need to test the actual phone. Code and documentation were prepared with Codex assistance; follow the course's AI-use rules and disclose assistance accurately.

真实手机传感器与权限仍需实际验证。代码和说明包含Codex协助，使用和披露须遵循课程要求。
