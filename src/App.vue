<script setup lang="ts">
import { ref, type Ref } from 'vue'

const vue2code = ref('')
const imports: Ref<string[]> = ref([])

const processCode = ref('')
const vue3code = ref('')

function convert() {
  imports.value = []
  reorganizer()
}

function reorganizer() {
  let scriptStart = vue2code.value.indexOf('<script')
  let scriptEnd = vue2code.value.indexOf('</script')
  let cut = vue2code.value.slice(scriptStart, scriptEnd + 9)
  processCode.value = vue2code.value
  processCode.value = processCode.value.replace(cut, '')
  processCode.value = cut + '\n' + processCode.value
  removeThis()
  replaceScript()
  getProps()
}

function removeThis() {
  processCode.value = processCode.value.replace(/this./g, '')
}

function replaceScript() {
  processCode.value = processCode.value.replace(/<script/, '<script setup')
}

function getProps() {
  if (processCode.value.includes('props:')) {
    let start = processCode.value.indexOf('props:')
    let cut = processCode.value.slice(start)
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let end = 0
    let oldToCut = undefined

    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let content = oldToCut.slice(8, oldToCut.length - 2)

    let newCode = 'let props = defineProps({' + content + '})'
    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  getMethods()
}

function getMethods() {
  if (processCode.value.includes('methods:')) {
    let start = processCode.value.indexOf('methods:')
    let cut = processCode.value.slice(start)
    let indexQuote = 0
    let endLoop = false
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let oldToCut = undefined

    //get mothod's end tag's index
    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    //get external method's end quote's index
    for (let i = 0; endLoop == false; i++) {
      if (cut[i] == ',') {
        indexQuote = i
      }
      if (cut[i] == '(') {
        if (indexQuote == 0) {
          indexQuote = 9
        }
        endLoop = true
      }
    }

    // if (indexQuote != 0) {
    //   externalMethods = cut.slice(0, indexQuote).replace(/(\r\n|\n|\r)/gm, '')
    // }

    // if (externalMethods) {
    //   externalMethods.split(',').map((element) => element.trim())
    // }

    //delete external methods - VERIFICAR

    let first = cut.slice(0, indexQuote + 1)
    let cuted = oldToCut.replace(first, '')

    let array = []

    let start2 = 0
    openKey = 0
    closeKey = 0

    for (let i = 0; i < cuted.length; i++) {
      if (cuted[i] == '{') {
        openKey++
      } else if (cuted[i] == '}') {
        closeKey++

        if (openKey == closeKey) {
          let m = cuted.slice(start2, i + 1)

          if (m[0] == ',') {
            m = m
              .slice(1)
              .replace(/(\r\n|\n|\r)/gm, '\n')
              .trim()
          } else {
            m = m.replace(/(\r\n|\n|\r)/gm, '\n').trim()
          }

          array.push(m)
          start2 = i + 1
        }
      }
    }

    let newArray = array.map((element) => {
      return 'function ' + element
    })

    let newCode = ''
    newArray.forEach((element) => {
      newCode += element + '\n'
    })

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  getData()
}

function getData() {
  if (processCode.value.includes('data()')) {
    imports.value.push('ref')
    let start = processCode.value.indexOf('data()')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let openKey2 = 0
    let closeKey2 = 0
    let oldToCut = undefined

    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }
    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let array = []
    let cuted = cut.trim().slice(cut.indexOf('return {') + 8, end)

    let start2 = 0
    openKey = 0
    closeKey = 0

    for (let i = 0; i < cuted.length; i++) {
      if (cuted[i] == '{') {
        openKey++
      } else if (cuted[i] == '}') {
        closeKey++
      } else if (cuted[i] == '[') {
        openKey2++
      } else if (cuted[i] == ']') {
        closeKey2++
      } else if (cuted[i] == ',') {
        if (openKey == closeKey && openKey2 == closeKey2) {
          let d = cuted.slice(start2, i + 1)
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

          array.push(d)
          start2 = i + 1
        }
      }
    }

    //get the last data
    let d = cuted.slice(start2)

    openKey = 0
    openKey2 = 0
    closeKey = 0
    closeKey2 = 0

    for (let i = 0; i < d.length; i++) {
      if (d[i] == '{') {
        openKey++
      } else if (d[i] == '}') {
        closeKey++
        if (closeKey > openKey) {
          d = d.slice(0, i)
        }
      } else if (d[i] == '[') {
        openKey2++
      } else if (d[i] == ']') {
        closeKey2++
        if (closeKey2 > openKey2) {
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

    array.push(d)

    let newArray = array.map((element) => {
      let el = element.replace(': ', ' = ref(')

      return 'const ' + el + ')'
    })

    let newCode = ''
    newArray.forEach((element) => {
      newCode += element + '\n'
    })

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  removeExportDefault()
}

function removeExportDefault() {
  if (processCode.value.includes('export default')) {
    let start = processCode.value.indexOf('export default')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let oldToCut = undefined

    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let newCode = oldToCut.slice(16, oldToCut.length - 1)

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  removeName()
}

function removeName() {
  if (processCode.value.includes('name:')) {
    let start = processCode.value.indexOf('name: ')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0

    let oldToCut = undefined

    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '"' || cut[i] == "'") {
        openKey++
      }
      if (openKey == 2) {
        endTag = true
        if (cut[i + 1] == ',' || cut[i + 1] == ';') {
          end = i + 1
        } else {
          end = i
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    processCode.value = processCode.value.replace(oldToCut, '')
  }

  removeComponents()
}

function removeComponents() {
  if (processCode.value.includes('components:')) {
    let start = processCode.value.indexOf('components:')

    if (start > 0) {
      let cut = processCode.value.slice(start)

      let end = 0
      let endTag = false
      let openKey = 0
      let closeKey = 0

      let oldToCut = undefined

      for (let i = 0; endTag == false; i++) {
        if (cut[i] == '{') {
          openKey++
        } else if (cut[i] == '}') {
          closeKey++
          if (openKey == closeKey) {
            endTag = true
            if (cut[i + 1] == ',' || cut[i + 1] == ';') {
              end = i + 1
            } else {
              end = i
            }
          }
        }
      }

      if (cut.slice(end, end + 2) == '},') {
        oldToCut = cut.slice(0, end + 2)
      } else {
        oldToCut = cut.slice(0, end + 1)
      }

      processCode.value = processCode.value.replace(oldToCut, '')
    }
  }

  getComputed()
}

function getComputed() {
  if (processCode.value.includes('computed:')) {
    imports.value.push('computed')
    let start = processCode.value.indexOf('computed:')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let oldToCut = undefined

    //get mothod's end tag's index
    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let cuted = oldToCut.slice(11)

    let array = []

    let start2 = 0
    openKey = 0
    closeKey = 0

    for (let i = 0; i < cuted.length; i++) {
      if (cuted[i] == '{') {
        openKey++
      } else if (cuted[i] == '}') {
        closeKey++

        if (openKey == closeKey) {
          let m = cuted.slice(start2, i + 1)

          if (m[0] == ',') {
            m = m
              .slice(1)
              .replace(/(\r\n|\n|\r)/gm, '\n')
              .trim()
          } else {
            m = m.replace(/(\r\n|\n|\r)/gm, '\n').trim()
          }

          array.push(m)
          start2 = i + 1
        }
      }
    }

    let newArray = array.map((element) => {
      let el = element.replace(')', ') =>').replace('(', ' = computed ((')

      return 'const ' + el + ')'
    })

    let newCode = ''
    newArray.forEach((element) => {
      newCode += element + '\n'
    })

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  getWatch()
}

function getWatch() {
  if (processCode.value.includes('watch:')) {
    imports.value.push('watch')
    let start = processCode.value.indexOf('watch:')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0
    let oldToCut = undefined

    //get mothod's end tag's index
    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let cuted = oldToCut.slice(11)

    let array = []

    let start2 = 0
    openKey = 0
    closeKey = 0

    for (let i = 0; i < cuted.length; i++) {
      if (cuted[i] == '{') {
        openKey++
      } else if (cuted[i] == '}') {
        closeKey++

        if (openKey == closeKey) {
          let m = cuted.slice(start2, i + 1)

          if (m[0] == ',') {
            m = m
              .slice(1)
              .replace(/(\r\n|\n|\r)/gm, '\n')
              .trim()
          } else {
            m = m.replace(/(\r\n|\n|\r)/gm, '\n').trim()
          }

          array.push(m)
          start2 = i + 1
        }
      }
    }

    let newArray = array.map((element) => {
      let el = undefined

      if (element.includes('handler')) {
        el = element

          .replace(': {', ',')
          .replace('handler', '')
          .replace(')', ') =>')
          .replace('},', '')
          .replace('deep: true', '')

        el = 'watch( ' + el + ')'
      } else {
        el = element.replace('(', ', (').replace(')', ' ) =>')

        el = 'watch( ' + el + ')'
      }

      return el
    })

    let newCode = ''
    newArray.forEach((element) => {
      newCode += element + '\n'
    })

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  getMounted()
}

function getMounted() {
  if (processCode.value.includes('mounted')) {
    imports.value.push('onMounted')
    let start = processCode.value.indexOf('mounted')
    let cut = processCode.value.slice(start)
    let end = 0
    let endTag = false
    let openKey = 0
    let closeKey = 0

    let oldToCut = undefined

    for (let i = 0; endTag == false; i++) {
      if (cut[i] == '{') {
        openKey++
      } else if (cut[i] == '}') {
        closeKey++
        if (openKey == closeKey) {
          end = i
          endTag = true
        }
      }
    }

    if (cut.slice(end, end + 2) == '},') {
      oldToCut = cut.slice(0, end + 2)
    } else {
      oldToCut = cut.slice(0, end + 1)
    }

    let newCode =
      'onMounted (() => {' + oldToCut.slice(11, oldToCut.length - 1) + ')'

    processCode.value = processCode.value.replace(oldToCut, newCode)
  }

  removeEmptyLines()
}

function removeEmptyLines() {
  processCode.value = processCode.value.replace(/(^[ \t]*\n)/gm, '')

  insertImports()
}

function insertImports() {
  if (imports.value.length > 0) {
    let i =
      'import {' +
      imports.value.map((element) => ' ' + element) +
      " } from 'vue'"

    processCode.value = processCode.value.replace(
      '<script setup>',
      '<script setup>' + '\n' + i
    )
  }
  vue3code.value = processCode.value
}
</script>

<template>
  <div class="p-5 mt-10 m-auto flex justify-center">
    <div class="w-full">
      <label for="vue2code">Insert here your vue2 code:</label>
      <textarea
        v-model="vue2code"
        name="vue2Code"
        id="vue2code"
        class="h-[70vh]"
      ></textarea>
    </div>
    <button @click="convert()">>></button>
    <div class="w-full">
      <label for="vue2code">See bellow your converted vue3 code!</label>
      <textarea
        disabled
        v-model="vue3code"
        name="vue2Code"
        id="vue2code"
        class="w-full h-[70vh]"
      ></textarea>
    </div>
  </div>
  <a
    class="fixed top-5 right-5 w-10"
    href="https://github.com/contatofabiofg/vue2tovue3"
    target="_blank"
  >
    <img src="../src/assets/github.png" alt="Github link" />
  </a>
</template>
