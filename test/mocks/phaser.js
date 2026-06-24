export const Phaser = {
  Math: {
    Clamp (value, min, max) {
      return Math.min(max, Math.max(min, value))
    },
    Linear (p0, p1, t) {
      return p0 + ((p1 - p0) * t)
    },
    Between (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    FloatBetween (min, max) {
      return Math.random() * (max - min) + min
    },
    DegToRad (degrees) {
      return degrees * (Math.PI / 180)
    },
    Angle: {
      Wrap (angle) {
        const twoPi = Math.PI * 2
        return angle - (twoPi * Math.floor((angle + Math.PI) / twoPi))
      }
    }
  }
}

export default Phaser
