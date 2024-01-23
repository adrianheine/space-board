import { createApp } from 'vue'

const PolledImage = {
  props: ["baseSrc", "interval"],
  data() {
    return { src: this.baseSrc + '?t=' + Date.now() }
  },
  mounted() {
    setTimeout(() => {
      this.src = this.baseSrc + '?t=' + Date.now()
    }, this.interval * 60 * 1000)
  },
  template: `<img :src="src" />`
}

const Widget = {
  props: ["name", "type", "spec", "isActive"],
  template: `<li :class="{ active: isActive }">
    <PolledImage v-if="type == 'polled-image'" :base-src="spec.baseSrc" :interval="spec.interval" />
  </li>`,
}

const Dashboard = {
  props: ["widgets"],
  data() {
    return {
      activeWidget: null,
      activeWidgetTimeout: null,
    }
  },

  methods: {
    click(idx) {
      this.activeWidget = idx
      clearTimeout(this.activeWidgetTimeout)
      this.activeWidgetTimeout = setTimeout(() => {
        this.activeWidget = null
      }, 300)
    }
  },

  template: `
    <article>
      <ul class=dashboard>
        <Widget v-for="(widget, idx) in widgets" :name="widget.name" :type="widget.type" :spec="widget.spec" :is-active="activeWidget == idx" />
      </ul>
    </article>
    <aside>
      <nav>
        <ul>
          <li v-for="(widget, idx) in widgets"><a @click="click(idx)">{{ widget.name }}</a></li>
        </ul>
      </nav>
    </aside>
`}

createApp({
  data() {
    return {
      widgets: [
        {name: "Wetter", type: "", spec: {}},
        {name: "Termine", type: "", spec: {}},
        {name: "Webcam", type: "polled-image", spec: {baseSrc: "https://cam.spacesquad.de/images/live.jpg", interval: 5}},
      ]
    }
  }
})
.component('Widget', Widget)
.component('PolledImage', PolledImage)
.component('Dashboard', Dashboard)
.mount('main')
