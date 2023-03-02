export default {
  defineSectionCut(aux) {
    let obj = aux

    for (let i = 0; obj.endTag == false; i++) {
      if (obj.cut[i] == '{') {
        obj.openKey++
      } else if (obj.cut[i] == '}') {
        obj.closeKey++
        if (obj.openKey == obj.closeKey) {
          obj.endTag = true
          if (obj.cut[i + 1] == ',' || obj.cut[i + 1] == ';') {
            obj.end = i + 1
          } else {
            obj.end = i
          }
        }
      }
    }

    if (obj.cut.slice(obj.end, obj.end + 2) == '},') {
      obj.oldToCut = obj.cut.slice(0, obj.end + 2)
    } else {
      obj.oldToCut = obj.cut.slice(0, obj.end + 1)
    }

    return obj
  },

  defineNameCut(aux) {
    let obj = aux

    for (let i = 0; obj.endTag == false; i++) {
      if (obj.cut[i] == '"' || obj.cut[i] == "'") {
        obj.openKey++
      }
      if (obj.openKey == 2) {
        obj.endTag = true
        if (obj.cut[i + 1] == ',' || obj.cut[i + 1] == ';') {
          obj.end = i + 1
        } else {
          obj.end = i
        }
      }
    }

    if (obj.cut.slice(obj.end, obj.end + 2) == '},') {
      obj.oldToCut = obj.cut.slice(0, obj.end + 2)
    } else {
      obj.oldToCut = obj.cut.slice(0, obj.end + 1)
    }

    return obj
  },

  composeArrayOf(aux) {
    let obj = aux

    obj.openKey = 0
    obj.closeKey = 0

    for (let i = 0; i < obj.cuted.length; i++) {
      if (obj.cuted[i] == '{') {
        obj.openKey++
      } else if (obj.cuted[i] == '}') {
        obj.closeKey++

        if (obj.openKey == obj.closeKey) {
          let m = obj.cuted.slice(obj.start2, i + 1)

          if (m[0] == ',') {
            m = m
              .slice(1)
              .replace(/(\r\n|\n|\r)/gm, '\n')
              .trim()
          } else {
            m = m.replace(/(\r\n|\n|\r)/gm, '\n').trim()
          }

          obj.array.push(m)
          obj.start2 = i + 1
        }
      }
    }

    return obj
  },

  formatNewCodeAndInsert(code, aux, array) {
    let newCode = ''
    array.forEach((element) => {
      newCode += element + '\n'
    })

    return code.replace(aux.oldToCut, newCode)
  },

  composeArrayOfData(aux) {
    let obj = aux

    obj.openKey = 0
    obj.closeKey = 0

    for (let i = 0; i < obj.cuted.length; i++) {
      if (obj.cuted[i] == '{') {
        obj.openKey++
      } else if (obj.cuted[i] == '}') {
        obj.closeKey++
      } else if (obj.cuted[i] == '[') {
        obj.openKey2++
      } else if (obj.cuted[i] == ']') {
        obj.closeKey2++
      } else if (obj.cuted[i] == ',') {
        if (obj.openKey == obj.closeKey && obj.openKey2 == obj.closeKey2) {
          let d = obj.cuted.slice(obj.start2, i + 1)
          if (d[0] == ',') {
            d = d
              .slice(1)
              .replace(/(\r\n|\n|\r)/gm, '')
              .trim()
          } else {
            d = d.replace(/(\r\n|\n|\r)/gm, '').trim()
          }
          if (d[d.length - 1] == ',') {
            d = d.substring(0, d.length - 1)
          }

          obj.array.push(d)
          obj.start2 = i + 1
        }
      }
    }
    return obj
  },

  getLastData(aux) {
    let obj = aux

    obj.openKey = 0
    obj.openKey2 = 0
    obj.closeKey = 0
    obj.closeKey2 = 0

    let d = obj.cuted.slice(aux.start2)

    for (let i = 0; i < d.length; i++) {
      if (d[i] == '{') {
        obj.openKey++
      } else if (d[i] == '}') {
        obj.closeKey++
        if (obj.closeKey > obj.openKey) {
          d = d.slice(0, i)
        }
      } else if (d[i] == '[') {
        obj.openKey2++
      } else if (d[i] == ']') {
        obj.closeKey2++
        if (obj.closeKey2 > obj.openKey2) {
          d = d.slice(0, i)
        }
      }
    }

    if (d[0] == ',') {
      d = d
        .slice(1)
        .replace(/(\r\n|\n|\r)/gm, '')
        .trim()
    } else {
      d = d.replace(/(\r\n|\n|\r)/gm, '').trim()
    }
    if (d[d.length] == ',') {
      d = d.substring(0, d.length - 1)
    }

    obj.array.push(d)

    return obj
  },
}
