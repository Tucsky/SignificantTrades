import Vue from 'vue'
import App from './App.vue'
import VueTippy, { TippyComponent } from 'vue-tippy'
import './assets/sass/app.scss'
import store from './store'

const vueEnv = process.env

for (const key in vueEnv) {
  const match = key.match(/^VUE_APP_(.*)/)
  if (match && match[1]) {
    store.commit(`app/SET_${match[1]}`, vueEnv[key])
  }
}

Vue.use(VueTippy, {
  maxWidth: '200px',
  duration: !store.state.settings.disableAnimations ? 200 : 0,
  arrow: false,
  animation: !store.state.settings.disableAnimations ? 'scale' : 'none',
  size: 'small',
  delay: !store.state.settings.disableAnimations ? 0 : [200, 0],
  animateFill: false,
  theme: 'blue'
})

import Verte from '@/components/framework/picker/Verte.vue'
import Editable from '@/components/framework/Editable.vue'
import Dropdown from '@/components/framework/Dropdown.vue'
Vue.component('tippy', TippyComponent)
Vue.component('verte', Verte)
Vue.component('dropdown', Dropdown)
Vue.component('editable', Editable)

import backgroundDirective from './directives/backgroundDirective'
Vue.directive('background', backgroundDirective)

new Vue({
  el: '#app',
  // router,
  store,
  render: h => h(App),
  props: ['initialized']
})
