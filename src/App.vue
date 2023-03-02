<script setup lang="ts">
import { ref, type Ref } from 'vue'
import objAux from './objAux.js'
import fnAux from './fnAux.js'

const vue2code = ref('')
const imports: Ref<string[]> = ref([])
const processCode = ref('')
const vue3code = ref('')

function convert() {
  imports.value = []
  reorganizer()
  removeThis()
  replaceScript()
  getProps()
  getMethods()
  getData()
  removeExportDefault()
  removeName()
  removeComponents()
  getComputed()
  getWatch()
  getMounted()
  removeEmptyLines()
  insertImports()

  toComplete()
}

function reorganizer() {
  let scriptStart = vue2code.value.indexOf('<script')
  let scriptEnd = vue2code.value.indexOf('</script')
  let cut = vue2code.value.slice(scriptStart, scriptEnd + 9)
  processCode.value = cut + '\n' + vue2code.value.replace(cut, '')
}

function removeThis() {
  processCode.value = processCode.value.replace(/this./g, '')
}

function replaceScript() {
  processCode.value = processCode.value.replace(/<script/, '<script setup')
}

function getProps() {
  if (processCode.value.includes('props:')) {
    let aux = new objAux(processCode.value, 'props:')
    aux = fnAux.defineSectionCut(aux)

    let content = aux.oldToCut.slice(8, aux.oldToCut.length - 2)
    let newCode = 'let props = defineProps({' + content + '})'
    processCode.value = processCode.value.replace(aux.oldToCut, newCode)
  }
}

function getMethods() {
  if (processCode.value.includes('methods:')) {
    let aux = new objAux(processCode.value, 'methods:')
    aux = fnAux.defineSectionCut(aux)

    //get external method's end quote's index
    for (let i = 0; aux.endLoop == false; i++) {
      if (aux.cut[i] == ',') {
        aux.indexQuote = i
      }
      if (aux.cut[i] == '(') {
        if (aux.indexQuote == 0) {
          aux.indexQuote = 9
        }
        aux.endLoop = true
      }
    }

    // if (indexQuote != 0) {
    //   externalMethods = cut.slice(0, indexQuote).replace(/(\r\n|\n|\r)/gm, '')
    // }

    // if (externalMethods) {
    //   externalMethods.split(',').map((element) => element.trim())
    // }

    //delete external methods - VERIFICAR
    let first = aux.cut.slice(0, aux.indexQuote + 1)
    aux.cuted = aux.oldToCut.replace(first, '')

    aux = fnAux.composeArrayOf(aux)
    let newArray = aux.array.map((element) => {
      return 'function ' + element
    })
    processCode.value = fnAux.formatNewCodeAndInsert(
      processCode.value,
      aux,
      newArray
    )
  }
}

function getData() {
  if (processCode.value.includes('data()')) {
    imports.value.push('ref')
    let aux = new objAux(processCode.value, 'data()')
    aux = fnAux.defineSectionCut(aux)

    aux.cuted = aux.cut.trim().slice(aux.cut.indexOf('return {') + 8, aux.end)
    aux = fnAux.composeArrayOfData(aux)

    aux = fnAux.getLastData(aux)

    let newArray = aux.array.map((element) => {
      let el = element.replace(': ', ' = ref(')
      return 'const ' + el + ')'
    })

    processCode.value = fnAux.formatNewCodeAndInsert(
      processCode.value,
      aux,
      newArray
    )
  }
}

function removeExportDefault() {
  if (processCode.value.includes('export default')) {
    let aux = new objAux(processCode.value, 'export default')
    aux = fnAux.defineSectionCut(aux)
    let newCode = aux.oldToCut.slice(16, aux.oldToCut.length - 1)
    processCode.value = processCode.value.replace(aux.oldToCut, newCode)
  }
}

function removeName() {
  if (processCode.value.includes('name:')) {
    let aux = new objAux(processCode.value, 'name:')
    aux = fnAux.defineNameCut(aux)
    processCode.value = processCode.value.replace(aux.oldToCut, '')
  }
}

function removeComponents() {
  if (processCode.value.includes('components:')) {
    let aux = new objAux(processCode.value, 'components:')
    aux = fnAux.defineSectionCut(aux)
    processCode.value = processCode.value.replace(aux.oldToCut, '')
  }
}

function getComputed() {
  if (processCode.value.includes('computed:')) {
    imports.value.push('computed')

    let aux = new objAux(processCode.value, 'computed:')
    aux = fnAux.defineSectionCut(aux)
    aux.cuted = aux.oldToCut.slice(11)
    aux = fnAux.composeArrayOf(aux)

    let newArray = aux.array.map((element) => {
      let el = element.replace(')', ') =>').replace('(', ' = computed ((')

      return 'const ' + el + ')'
    })

    processCode.value = fnAux.formatNewCodeAndInsert(
      processCode.value,
      aux,
      newArray
    )
  }
}

function getWatch() {
  if (processCode.value.includes('watch:')) {
    imports.value.push('watch')
    let aux = new objAux(processCode.value, 'watch:')
    aux = fnAux.defineSectionCut(aux)
    aux.cuted = aux.oldToCut.slice(11)
    aux = fnAux.composeArrayOf(aux)

    let newArray = aux.array.map((element) => {
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

    processCode.value = fnAux.formatNewCodeAndInsert(
      processCode.value,
      aux,
      newArray
    )
  }
}

function getMounted() {
  if (processCode.value.includes('mounted')) {
    imports.value.push('onMounted')
    let aux = new objAux(processCode.value, 'mounted')
    aux = fnAux.defineSectionCut(aux)

    let newCode =
      'onMounted (() => {' +
      aux.oldToCut.slice(11, aux.oldToCut.length - 1) +
      ')'
    processCode.value = processCode.value.replace(aux.oldToCut, newCode)
  }
}

function removeEmptyLines() {
  processCode.value = processCode.value.replace(/(^[ \t]*\n)/gm, '')
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
}

function toComplete() {
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
