import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './main.css';

// api
import api from './api';
Vue.prototype.$http = api;

// vue-awesome icons
import 'vue-awesome/icons';
// @todo import only needed icons
// import 'vue-awesome/icons/arrow-down';
import Icon from 'vue-awesome/components/Icon';
Vue.component('Icon', Icon);

// global components
import Button from '@/components/Button';
Vue.component('Button', Button);
import Input from '@/components/Input/Input';
Vue.component('Input', Input);
import Loading from '@/components/Loading';
Vue.component('Loading', Loading);

// disable console message
Vue.config.productionTip = false;

// bus
const EventBus = new Vue();
Vue.prototype.$bus = EventBus;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
