import { createApp } from 'vue'

const Image = {
  props: ["src"],
  template: `<img :src="src" />`
}

const Widget = {
  props: ["name", "type", "spec", "isActive"],
  template: `<li :class="{ active: isActive }">
    <Image v-if="type == 'image'" :src="spec.src" />
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
        {name: "Webcam", type: "image", spec: {src: "https://cam.spacesquad.de/images/live.jpg"}},
      ]
    }
  }
})
.component('Widget', Widget)
.component('Image', Image)
.component('Dashboard', Dashboard)
.mount('main')
