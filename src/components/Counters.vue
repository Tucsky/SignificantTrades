<template>
  <div id="counters" class="counters">
    <ul ref="countersList">
      <li
        v-for="(obj, index) of stackedSums"
        :key="`sum-${index}`"
        v-if="!hideIncompleteCounter || index <= completed"
        class="counters__item"
      >
        <div
          class="counter__index"
          v-tippy="{ placement: 'left' }"
          title="Edit interval"
        >
          <editable
            :content="labels[index]"
            @output="updateCounterStep(index, $event)"
          ></editable>
        </div>
        <div class="counter__row">
          <div>
            <div
              class="counter__up"
              :style="{ flexBasis: (obj.volumeUp / (obj.volumeUp+obj.volumeDown)) * 100 + '%' }"
              :data-amount="$root.formatAmount(obj.volumeUp, 2)"
            >
              <div v-if="index === 0" class="counter__light"></div>
            </div>
            <div
              class="counter__down"
              :style="{ flexBasis: (obj.volumeDown / (obj.volumeUp+obj.volumeDown)) * 100 + '%' }"
              :data-amount="$root.formatAmount(obj.volumeDown, 2)"
            >
              <div v-if="index === 0" class="counter__light"></div>
            </div>
          </div>
          <div>
            <div
              class="counter__up"
              :style="{ flexBasis: (obj.moveUp / (obj.moveUp+obj.moveDown)) * 100 + '%' }"
              :data-amount="$root.formatAmount(obj.moveUp, 2)"
            >
            </div>
            <div
              class="counter__down"
              :style="{ flexBasis: (obj.moveDown / (obj.moveUp+obj.moveDown)) * 100 + '%' }"
              :data-amount="$root.formatAmount(obj.moveDown, 2)"
            >
            </div>
          </div>
        </div>
        <div
          class="counter__delete icon-cross"
          @click="deleteCounter(index)"
        ></div>
      </li>
    </ul>
    <!-- <div class="counters__add"><i class="icon-add"></i> Add step</div> -->
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../services/socket'

export default {
  data() {
    return {
      labels: [],
      strictSums: [],
      stackedSums: [],
      counters: [],
      complete: 0,
      queue: [0, 0, 0, 0],
      strength: [0, 0],
    }
  },
  computed: {
    ...mapState([
      'pair',
      'actives',
      'thresholds',
      'countersSteps',
      'counterPrecision',
      'cumulativeCounters',
      'hideIncompleteCounter',
      'preferQuoteCurrencySize'
    ]),
  },
  created() {
    const now = +new Date()

    window.cntr = this

    if (this.counters.length < this.countersSteps.length) {
      for (let i = this.counters.length; i < this.countersSteps.length; i++) {
        this.labels.push(this.$root.ago(now - this.countersSteps[i]))
        this.counters.push([])
        this.strictSums.push([0, 0, 0, 0])
        this.stackedSums.push({volumeUp:0,volumeDown:0,moveUp:0,moveDown:0})
      }
    }

    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'setTimeframe':
        case 'setCounterStep':
        case 'toggleCumulativeCounters':
        case 'replaceCounterSteps':
        case 'reloadExchangeState':
          this.rebuildCounters()
          break
      }
    })

    socket.$on('trades.queued', this.appendTrades)
    socket.$on('trades.instant', this.highlightSide)
    socket.$on('historical', this.onFetch)

    this.rebuildCounters()
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.appendTrades)
    socket.$off('trades.instant', this.highlightSide)
    socket.$off('historical', this.onFetch)

    clearInterval(this.countersRefreshCycleInterval)

    this.onStoreMutation()
  },
  methods: {
    highlightSide(trades) {
      const volume = [0, 0]

      for (let i = 0; i < trades.length; i++) {
        volume[+trades[i][4]] += trades[i][3] * trades[i][2]
      }

      const side = volume[1] > volume[0] ? 1 : 0

      const strength =
        (this.strength[side] + volume[side]) / (this.thresholds[0].amount * 0.1)

      const element = this.$refs.countersList.children[0].querySelector(
        '.counter__' + (side ? 'up' : 'down')
      ).children[0]

      element.style.background = `linear-gradient(to ${
        side ? 'right' : 'left'
      }, rgba(255, 255, 255, 0), rgba(255, 255, 255, ${(strength * 0.8).toFixed(
        2
      )}))`

      element.classList.remove('-highlight')
      void element.offsetWidth
      element.classList.add('-highlight')

      this.strength[side] = (this.strength[side] + volume[side]) * 0.75
    },
    appendTrades(trades) {
      const now = +new Date()

      let upVolume = 0
      let downVolume = 0
      let upMove = 0
      let downMove = 0

      for (let index = 0; index < trades.length; index++) {
        if (trades[index][4] > 0) {
          upMove += trades[index][6]
          upVolume += trades[index][3] * (this.preferQuoteCurrencySize ? trades[index][2] : 1)
        } else {
          downMove += trades[index][6]
          downVolume += trades[index][3] * (this.preferQuoteCurrencySize ? trades[index][2] : 1)
        }
      }

      this.queue[0] += upVolume
      this.queue[1] += downVolume
      this.queue[2] += upMove
      this.queue[3] += downMove

      for (let index = 0; index < this.stackedSums.length; index++) {
        this.$set(
          this.stackedSums[index],
          "moveUp",
          this.stackedSums[index].moveUp + upMove,
        )
        this.$set(
          this.stackedSums[index],
          "moveDown",
          this.stackedSums[index].moveDown + downMove,
        )
        this.$set(
          this.stackedSums[index],
          "volumeUp",
          this.stackedSums[index].volumeUp + upVolume,
        )
        this.$set(
          this.stackedSums[index],
          "volumeDown",
          this.stackedSums[index].volumeDown + downVolume,
        )

        if (!this.cumulativeCounters) {
          break
        }
      }
    },
    onFetch(ticks) {
      const trades = this.getTicksTrades()
      const stacks = this.stackTrades(trades)

      this.populateCounters(stacks)
    },
    updateCounters() {
      if (!this.counters.length) {
        return
      }

      const now = +new Date()

      if (this.queue[0] || this.queue[1]|| this.queue[2]|| this.queue[3]) {
        this.counters[0].push([now, this.queue[0], this.queue[1], this.queue[2], this.queue[3]])
        for(var i=0; i < 4;++i) {
          this.strictSums[0][i] += this.queue[i]
          this.queue[i]=0
        }
      }

      let stepIndex = 0
      let stackedUpVolume = 0
      let stackedDownVolume = 0
      let stackedUpMove = 0
      let stackedDownMove = 0

      for (let step of this.countersSteps) {
        let upVolume = 0
        let downVolume = 0
        let upMove = 0
        let downMove = 0

        let i

        for (i = 0; i < this.counters[stepIndex].length; i++) {
          if (this.counters[stepIndex][i][0] - 10 > now - step) {
            break
          }

          upVolume += this.counters[stepIndex][i][1]
          downVolume += this.counters[stepIndex][i][2]
          upMove += this.counters[stepIndex][i][3]
          downMove += this.counters[stepIndex][i][4]
        }

        if (i > 0) {
          const expired = this.counters[stepIndex].splice(0, i)

          this.strictSums[stepIndex][0] -= upVolume
          this.strictSums[stepIndex][1] -= downVolume
          this.strictSums[stepIndex][2] -= upMove
          this.strictSums[stepIndex][3] -= downMove

          if (this.counters[stepIndex + 1]) {
            this.counters[stepIndex + 1].push(...expired)
            this.strictSums[stepIndex + 1][0] += upVolume
            this.strictSums[stepIndex + 1][1] += downVolume
            this.strictSums[stepIndex + 1][2] += upMove
            this.strictSums[stepIndex + 1][3] += downMove

            if (this.completed < stepIndex) {
              this.completed = stepIndex
            }
          }
        }

        if (!this.cumulativeCounters) {
          stackedUpVolume = 0
          stackedDownVolume = 0
          stackedUpMove = 0
          stackedDownMove = 0
        }

        stackedUpVolume += this.strictSums[stepIndex][0]
        stackedDownVolume += this.strictSums[stepIndex][1]
        stackedUpMove += this.strictSums[stepIndex][2]
        stackedDownMove += this.strictSums[stepIndex][3]

        this.$set(this.stackedSums[stepIndex], "volumeUp", parseFloat(stackedUpVolume))
        this.$set(this.stackedSums[stepIndex], "volumeDown", parseFloat(stackedDownVolume))
        this.$set(this.stackedSums[stepIndex], "moveUp", parseFloat(stackedUpMove))
        this.$set(this.stackedSums[stepIndex], "moveDown", parseFloat(stackedDownMove))

        stepIndex++
      }
    },
    stackTrades(trades) {
      const now = +new Date()
      const minTimestampForCounter = this.countersSteps[
        this.countersSteps.length - 1
      ]

      let stacks = []

      for (let trade of trades) {
        if (
          this.actives.indexOf(trade[0]) === -1 ||
          trade[1] < now - minTimestampForCounter
        ) {
          continue
        }

        const isBuy = +trade[4] > 0 ? true : false
        const amount = trade[3] * (this.preferQuoteCurrencySize ? trade[2] : 1)
        const move = trade[6]
        if (
          stacks.length &&
          trade[1] - stacks[stacks.length - 1][0] < this.counterPrecision
        ) {
          stacks[stacks.length - 1][isBuy ? 1 : 2] += amount
          stacks[stacks.length - 1][isBuy ? 3 : 4] += move
        } else {
          stacks.push([
            +trade[1],
            isBuy ? amount : 0,
            !isBuy ? amount : 0,
            isBuy ? move : 0,
            !isBuy ? move : 0
          ])
        }
      }

      return stacks
    },
    populateCounters(stacks) {
      if (!stacks || !stacks.length) {
        return
      }

      const now = +new Date()

      let last = 0

      for (let stack of stacks) {
        for (let index = 0; index < this.countersSteps.length; index++) {
          if (stack[0] > now - this.countersSteps[index]) {
            this.counters[index].push(stack)
            for(let i = 0; i < 4;++i) {
              this.strictSums[index][i] += stack[i+1]
            }
            break
          }
        }
      }

      let stackedUpVolume = 0
      let stackedDownVolume = 0
      let stackedUpMove = 0
      let stackedDownMove = 0
      let completed = 0

      for (let index = 0; index < this.countersSteps.length; index++) {
        this.counters[index] = this.counters[index].sort((a, b) => a[0] - b[0])

        if (!this.cumulativeCounters) {
          stackedUpVolume = 0
          stackedDownVolume = 0
          stackedUpMove = 0
          stackedDownMove = 0

        }

        stackedUpVolume += this.strictSums[index][0]
        stackedDownVolume += this.strictSums[index][1]
        stackedUpMove += this.strictSums[index][2]
        stackedDownMove += this.strictSums[index][3]

        this.$set(this.stackedSums[index], "volumeUp", parseFloat(stackedUpVolume))
        this.$set(this.stackedSums[index], "volumeDown", parseFloat(stackedDownVolume))
        this.$set(this.stackedSums[index], "moveUp", parseFloat(stackedUpMove))
        this.$set(this.stackedSums[index], "moveDown", parseFloat(stackedDownMove))

        if (stacks[0][0] < now - this.countersSteps[index] * 0.99) {
          completed = index
        }
      }

      this.completed = completed
    },
    updateCounterStep(index, value) {
      if (!value) {
        return this.$store.commit('setCounterStep', {
          index: index,
          value: null,
        })
      }

      let milliseconds = parseFloat(value)

      if (isNaN(milliseconds)) {
        return false
      }

      if (/[\d.]+s/.test(value)) {
        milliseconds *= 1000
      } else if (/[\d.]+h/.test(value)) {
        milliseconds *= 1000 * 60 * 60
      } else {
        milliseconds *= 1000 * 60
      }

      return this.$store.commit('setCounterStep', {
        index: index,
        value: milliseconds,
      })
    },
    rebuildCounters() {
      clearInterval(this.countersRefreshCycleInterval)

      const now = +new Date()

      this.completed = 0
      this.labels.splice(0, this.labels.length)
      this.counters.splice(0, this.counters.length)
      this.strictSums.splice(0, this.strictSums.length)
      this.stackedSums.splice(0, this.stackedSums.length)

      for (let i = 0; i < this.countersSteps.length; i++) {
        this.labels.push(this.$root.ago(now - this.countersSteps[i]))
        this.counters.push([])
        this.strictSums.push([0, 0,0,0])
        this.stackedSums.push({volumeUp:0,volumeDown:0,moveUp:0,moveDown:0})
      }

      const trades = this.getTicksTrades()
      const stacks = this.stackTrades(trades)

      this.populateCounters(stacks)

      console.log(
        `[counters.rebuild]\n`,
        this.counters
          .map(
            (a, index) =>
              `\t- Counter ${this.labels[index]} got ${a.length} stacks`
          )
          .join('\n')
      )

      this.countersRefreshCycleInterval = window.setInterval(
        this.updateCounters.bind(this),
        this.counterPrecision
      )
    },
    deleteCounter(index) {
      if (this.countersSteps.length === 1) {
        this.$store.commit('toggleCounters', false)

        return
      }

      this.$store.commit('setCounterStep', { index: index, value: null })
    },
    getTicksTrades() {
      return socket.ticks
        .reduce((prev, curr) => {
          const ratio = {
            buys: curr.buys / (curr.sells + curr.buys),
            sells: curr.sells / (curr.sells + curr.buys),
          }

          if (curr.buys > 0) {
            prev.push([
              curr.exchange,
              curr.timestamp,
              curr.close,
              ratio.buys * curr.volume,
              true,
              ratio.buys * curr.records,
            ])
          }

          if (curr.sells > 0) {
            prev.push([
              curr.exchange,
              curr.timestamp,
              curr.close,
              ratio.sells * curr.volume,
              false,
              ratio.sells * curr.records,
            ])
          }

          return prev
        }, [])
        .concat(socket.trades)
    },
  },
}
</script>

<style lang="scss">
@import '../assets/sass/variables';

.counters__add {
  background-color: rgba(white, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2em;
  font-size: 0.8em;
  cursor: pointer;

  transition: background-color 0.2s $easeOutExpo;

  i.icon-add {
    margin-right: 0.5em;
  }

  &:hover {
    background-color: $blue;
  }
}

.counters {
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    flex-flow: column nowrap;

    li {
      display: flex;
      flex-flow: row nowrap;
      position: relative;
      align-items: stretch;
    }
  }
}

.counter__row {
  display: flex;
  flex-basis: 100%;
  flex-flow: column nowrap;
  div {
    display:flex;
    flex-basis: 50%;
  }
}

.counters__item {
  > div {
    padding: 0.25em;
  }

  &:hover {
    .counter__delete {
      flex-basis: 2.35em;

      &:before {
        transform: none;
        opacity: 1;
      }
    }
  }

  .counter__delete {
    color: white;
    background-color: rgba(black, 0.8);
    transition: flex-basis 0.2s $easeOutExpo;
    font-size: 0.8em;
    flex-basis: 0px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    cursor: pointer;

    &:before {
      display: inline-block;
      transform: rotateZ(45deg);
      opacity: 0;
      transition: all 0.2s $easeOutExpo;
    }
  }
}

.counter__index {
  flex-basis: 2.5em;
  white-space: nowrap;
  text-align: left;
  flex-shrink: 0;
  transition: padding 0.2s $easeOutExpo;
  position: relative;
  color: white;
  background-color: rgba(black, 0.2);

  [contenteditable] {
    padding: 4px;
    font-size: 0.8em;
  }
}

.counter__up,
.counter__down {
  position: relative;
  font-family: monospace;
  transition: flex-basis 0.4s $easeOutExpo;

  flex-basis: 50%;

  &:before {
    content: attr(data-amount);
    position: absolute;
    margin: 0 0.2em;
    line-height: 1.75em;
    z-index: 1;
  }
}

.counter__light {
  position: absolute;
  top: 0;
  bottom: 0;
  opacity: 0;
  width: 2em;

  &.-highlight {
    animation: highlight 0.5s $easeOutExpo;
  }
}

.counter__up {
  text-align: left;
  background-color: desaturate($green, 5);
  color: white;

  .counter__light {
    right: 0;
  }

  &:before {
    left: 0.25em;
  }
}

.counter__down {
  text-align: right;
  background-color: $red;
  color: white;

  .counter__light {
    left: 0;
  }

  &:before {
    right: 0.25em;
  }
}
</style>
