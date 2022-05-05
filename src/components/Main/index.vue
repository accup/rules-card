<script setup lang="ts">
import InputText from '@/components/InputText/index.vue'
import styles from './index.module.scss'

import { ref, computed } from 'vue'

import { iterate } from '@/scripts/iterable'
import { CardSet, RulesCard } from '@/scripts/rules_card'

const MAN_KIND = 'm'
const PIN_KIND = 'p'
const SOU_KIND = 's'
const JI_KIND = 'z'
const SU_KINDS = [MAN_KIND, PIN_KIND, SOU_KIND]

const rulesCard = new RulesCard()

for (const kind of SU_KINDS) {
  for (let number = 1; number <= 7; ++number) {
    rulesCard.registerCardSet(
      '順子',
      new CardSet([
        [`${number}${kind}`, BigInt('1')],
        [`${number + 1}${kind}`, BigInt('1')],
        [`${number + 2}${kind}`, BigInt('1')],
      ]),
    )
  }
}

const pairs: [string, bigint][] = [
  ['対子', BigInt('2')],
  ['刻子', BigInt('3')],
  ['槓子', BigInt('4')],
]
for (const [name, count] of pairs) {
  for (const kind of SU_KINDS) {
    for (let number = 1; number <= 9; ++number) {
      rulesCard.registerCardSet(
        name,
        new CardSet([[`${number}${kind}`, count]]),
      )
    }
  }
  for (let number = 1; number <= 7; ++number) {
    rulesCard.registerCardSet(
      name,
      new CardSet([[`${number}${JI_KIND}`, count]]),
    )
  }
}

const cardSetText = ref('')
const cardSet = computed((): CardSet => {
  const cardCountMap = new Map<string, bigint>()
  for (const match of cardSetText.value.matchAll(/[0-9A-Za-z]/g)) {
    const card = match[0]
    const lastCount = cardCountMap.get(card) ?? BigInt('0')
    cardCountMap.set(card, lastCount + BigInt('1'))
  }
  return new CardSet(cardCountMap.entries())
})
const cardCountList = computed((): [string, bigint][] => {
  return [...cardSet.value.cardCountPairs]
})

// for (const result of rulesCard.partition(hand, { complementCount: 0 })) {
//   if (result.rest.totalCount() > 0) {
//     continue
//   }

//   console.log(
//     '残手札',
//     '{',
//     [
//       ...iterate(result.rest.cardCountPairs).map(
//         ([card, count]) => `${card}: ${count}`,
//       ),
//     ].join(', '),
//     '}',
//   )
//   for (const part of result.parts) {
//     console.log(
//       '  ',
//       '{',
//       [
//         ...iterate(part.pattern.cardCountPairs).map(
//           ([card, count]) => `${card}: ${count}`,
//         ),
//       ].join(', '),
//       '}',
//     )
//     for (const namedComplements of part.countNamedComplementsMap.values()) {
//       for (const namedComplement of namedComplements) {
//         console.log(
//           '  ',
//           '  ',
//           namedComplement.name,
//           '{',
//           [
//             ...iterate(namedComplement.complement.cardCountPairs).map(
//               ([card, count]) => `${card}: ${count}`,
//             ),
//           ].join(', '),
//           '}',
//         )
//       }
//     }
//   }
// }
</script>

<template>
  <div>
    <InputText v-model:text="cardSetText" />
  </div>
  <div>
    <div v-for="[card, count] in cardCountList">{{ card }}: {{ count }}</div>
  </div>
</template>
