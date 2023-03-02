export default class ObjAux {
  start
  cut
  indexQuote = 0
  endLoop = false
  end = 0
  endTag = false
  openKey = 0
  closeKey = 0
  openKey2 = 0
  closeKey2 = 0
  oldToCut = ''
  array = []
  start2 = 0
  cuted = ''

  constructor(code, search) {
    this.start = code.indexOf(search)
    this.cut = code.slice(this.start)
  }
}
