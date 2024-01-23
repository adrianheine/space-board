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
  template: `<li class="widget" :class="{ active: isActive }">
    <h2>{{ name }}</h2>
    <PolledImage v-if="type == 'polled-image'" :base-src="spec.baseSrc" :interval="spec.interval" />
  </li>`,
}

const Dashboard = {
  props: ["initialWidgets"],
  data() {
    return {
      widgets: this.initialWidgets.map(w => ({id: w.name.toLowerCase(), ...w})),
      activeWidget: null,
      activeWidgetTimeout: null,
    }
  },

  methods: {
    click(id) {
      if (this.widgets[0].id === id) {
        this.activeWidget = id
        clearTimeout(this.activeWidgetTimeout)
        this.activeWidgetTimeout = setTimeout(() => {
          this.activeWidget = null
        }, 300)
      } else {
        this.widgets.splice(0, 0, ...this.widgets.splice(this.widgets.findIndex(w => w.id == id), 1))
      }
    }
  },

  template: `
    <article class=dashboard>
      <TransitionGroup name="list" tag="ul">
        <Widget v-for="widget in widgets" :key="widget.id" :name="widget.name" :type="widget.type" :spec="widget.spec" :is-active="activeWidget == widget.id" />
      </TransitionGroup>
    </article>
    <aside>
      <nav>
        <TransitionGroup name="list" tag="ul">
          <li v-for="widget in widgets" :key="widget.id"><a @click="click(widget.id)">{{ widget.name }}</a></li>
        </TransitionGroup>
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
