import { Bot } from 'mineflayer';
import { MyBot, TextMessageData } from '../types/autobuy'


// Function to inject smooth look with jitter and head bobbing
export default function injectSmoothLook(bot: MyBot): void {
  const originalLook = bot.look;
  let lastMoveTime = 0;
  const headBobAmplitude = 0.02; // Adjust this value to control the amplitude of the head bobbing
  const headBobFrequency = 10; // How fast the head bobs (in ticks)

  // Function to add random jitter (small random deviation)
  function addJitter(amount: number = 0.02): number {
    return (Math.random() - 0.5) * amount; // random value between -amount and +amount
  }

  // Smooth Look with jitter and optional head bobbing
  bot.smoothLook = function (
    targetYaw: number,
    targetPitch: number,
    duration: number = 300,
    steps: number = 10,
    jitterAmount: number = 0.02,
    headBobbing: boolean = true
  ): void {
    const currentYaw = bot.entity.yaw;
    const currentPitch = bot.entity.pitch;

    const yawDiff = targetYaw - currentYaw;
    const pitchDiff = targetPitch - currentPitch;

    let step = 0;

    const interval = setInterval(() => {
      if (step >= steps) return clearInterval(interval);

      const t = step / steps;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      // Apply jitter to the target yaw and pitch
      const jitterYaw = addJitter(jitterAmount);
      const jitterPitch = addJitter(jitterAmount);

      // If head bobbing is enabled, modify the pitch slightly
      let pitch = currentPitch + pitchDiff * eased + jitterPitch;
      if (headBobbing) {
        const time = Date.now() - lastMoveTime;
        const bobbingEffect = Math.sin(time / headBobFrequency) * headBobAmplitude;
        pitch += bobbingEffect;  // Apply head bobbing effect to pitch
      }

      const yaw = currentYaw + yawDiff * eased + jitterYaw;

      originalLook.call(bot, yaw, pitch, true); // smooth and force the movement
      step++;
    }, duration / steps);
  };

  // Override bot.look to always be smooth with jitter and optional head bobbing
  bot.look = (
    yaw: number,
    pitch: number,
    force: boolean = true,
    jitterAmount: number = 0.02,
    headBobbing: boolean = true
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      bot.smoothLook(yaw, pitch, 300, 10, jitterAmount, headBobbing);
      resolve(); // Resolve the promise after the smooth look is completed
    });
  };

  // Update last move time on movement (e.g., walking or running)
  bot.on('move', () => {
    lastMoveTime = Date.now();
  });
}
