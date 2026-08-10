import { cS as o, _ as f, Z as a } from './invariable-DewVS0br.js'
const s = o(),
  i = {
    on: (o, i) => {
      s.on(o, i),
        f() &&
          a(() => {
            s.off(o, i)
          })
    },
    emit: (o, f) => {
      s.emit(o, f)
    },
    off: (o, f) => {
      s.off(o, f)
    }
  }
export { i as u }
