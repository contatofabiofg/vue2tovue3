<script setup lang="ts">
import { ref } from 'vue'

const vue2code = ref('')
const processCode = ref('')
const vue3code = ref('')

function convert() {
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
  if (processCode.value.includes('props:')) {
    getProps()
  } else {
    getMethods()
  }
}

function removeThis() {
  processCode.value = processCode.value.replace(/this./g, '')
}

function replaceScript() {
  processCode.value = processCode.value.replace(/<script/, '<script setup')
}

function getProps() {
  let propsStart = processCode.value.indexOf('props:')
  let cut = processCode.value.slice(propsStart + 6)
  let endTag = false
  let openKey = 0
  let closeKey = 0
  let propsEnd = 0

  for (let i = 0; endTag == false; i++) {
    if (cut[i] == '{') {
      openKey++
    } else if (cut[i] == '}') {
      closeKey++
      if (openKey == closeKey) {
        propsEnd = i
        endTag = true
      }
    }
  }

  let integerProps = processCode.value.slice(
    propsStart,
    propsStart + 6 + propsEnd + 1
  )

  let contentProps = processCode.value.slice(
    propsStart + 6,
    propsStart + 6 + propsEnd + 1
  )

  let newProps = 'let props: defineProps(' + contentProps + ')'
  processCode.value = processCode.value.replace(integerProps, newProps)
  vue3code.value = processCode.value
  getMethods()
}

function getMethods() {
  let methodsStart = processCode.value.indexOf('methods:')
  let cut = processCode.value.slice(methodsStart)
  let indexQuote = 0
  let endLoop = false
  let endMethods = 0
  let endTag = false
  let openKey = 0
  let closeKey = 0
  let oldMethodToCut = undefined

  //get mothod's end tag's index
  for (let i = 0; endTag == false; i++) {
    if (cut[i] == '{') {
      openKey++
    } else if (cut[i] == '}') {
      closeKey++
      if (openKey == closeKey) {
        endMethods = i
        endTag = true
      }
    }
  }

  oldMethodToCut = cut.slice(0, endMethods + 1)

  //get external method's end quote's index
  for (let i = 0; endLoop == false; i++) {
    if (cut[i] == ',') {
      indexQuote = i
    }
    if (cut[i] == '(') {
      endLoop = true
    }
  }

  // if (indexQuote != 0) {
  //   externalMethods = cut.slice(0, indexQuote).replace(/(\r\n|\n|\r)/gm, '')
  // }

  // if (externalMethods) {
  //   externalMethods.split(',').map((element) => element.trim())
  // }

  //delete external methods
  let firstMethods = cut.slice(0, indexQuote + 1)
  cut = cut.replace(firstMethods, '')

  let arrayOfMethods = []
  let cutedMethods = cut.trim().slice(0, endMethods)
  let start = 0
  openKey = 0
  closeKey = 0

  for (let i = 0; i < cutedMethods.length; i++) {
    if (cut[i] == '{') {
      openKey++
    } else if (cut[i] == '}') {
      closeKey++
      if (openKey == closeKey) {
        let m = cut.slice(start, i + 1)
        if (m[0] == ',') {
          m = m
            .slice(1)
            .replace(/(\r\n|\n|\r)/gm, '\n')
            .trim()
        } else {
          m = m.replace(/(\r\n|\n|\r)/gm, '\n').trim()
        }

        arrayOfMethods.push(m)
        start = i + 1
      }
    }
  }

  let newArrayOfmethods = arrayOfMethods.map((element) => {
    let el = element.replace(/this./g, '').replace(')', ') =')

    return 'function ' + el
  })

  let newMethods = ''
  newArrayOfmethods.forEach((element) => {
    newMethods += element + '\n'
  })

  processCode.value = processCode.value.replace(oldMethodToCut, newMethods)
  vue3code.value = processCode.value

  getData()
}

function getData() {
  let dataStart = processCode.value.indexOf('data()')
  let cut = processCode.value.slice(dataStart)
  //let indexQuote = 0
  //let endLoop = false
  let endDataIndexOnCut = 0
  let endTag = false
  let openKey = 0
  let closeKey = 0
  let openKey2 = 0
  let closeKey2 = 0
  let oldDataToCut = undefined

  for (let i = 0; endTag == false; i++) {
    if (cut[i] == '{') {
      openKey++
    } else if (cut[i] == '}') {
      closeKey++
      if (openKey == closeKey) {
        endDataIndexOnCut = i
        endTag = true
      }
    }
  }

  oldDataToCut = cut.slice(0, endDataIndexOnCut + 1)
  console.log(oldDataToCut)

  let arrayOfDatas = []
  let cutedDatas = cut
    .trim()
    .slice(cut.indexOf('return {') + 8, endDataIndexOnCut)
  console.log(cutedDatas)

  let start = 0
  openKey = 0
  closeKey = 0

  for (let i = 0; i < cutedDatas.length; i++) {
    if (cutedDatas[i] == '{') {
      openKey++
    } else if (cutedDatas[i] == '}') {
      closeKey++
    } else if (cutedDatas[i] == '[') {
      openKey2++
    } else if (cutedDatas[i] == ']') {
      closeKey2++
    } else if (cutedDatas[i] == ',') {
      if (openKey == closeKey && openKey2 == closeKey2) {
        let d = cutedDatas.slice(start, i + 1)
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

        arrayOfDatas.push(d)
        start = i + 1
      }
    }
  }

  //get the las data
  let d = cutedDatas.slice(start)
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

  arrayOfDatas.push(d)

  let newArrayOfDatas = arrayOfDatas.map((element) => {
    let el = element.replace(': ', ' = ref(')

    return 'const ' + el + ')'
  })

  let newDatas = ''
  newArrayOfDatas.forEach((element) => {
    newDatas += element + '\n'
  })

  processCode.value = processCode.value.replace(oldDataToCut, newDatas)
  vue3code.value = processCode.value
}
</script>

<template>
  <div class="w-[75%] mt-20 m-auto flex flex-col justify-center items-center">
    <label for="vue2code">Insert here your vue2 code:</label>
    <textarea
      v-model="vue2code"
      name="vue2Code"
      id="vue2code"
      cols="30"
      rows="10"
    ></textarea>
    <button @click="convert()">Convert</button>
    <label for="vue2code">See bellow your converted vue3 code!</label>
    <textarea
      disabled
      v-model="vue3code"
      name="vue2Code"
      id="vue2code"
      cols="30"
      rows="10"
    ></textarea>
  </div>
</template>
