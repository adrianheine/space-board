import { createApp } from 'vue'

const Widget = {
  props: ["name"],
  template: `<li><slot /></li>`
}

const Image = {
  props: ["src"],
  template: `<img :src="{{ src }}" />`
}

const Dashboard = {
  props: ["widgets"],
  template: `
  <article>
  <ul class=dashboard>
    <slot />
  </ul>
  </article>
<aside>
  <nav>
    <a v-for="widget in widgets">{{ widget.name }}</a>
  </nav>
</aside>
`}

createApp({
  data() {
    return {
      widgets: [
        { name: "Wetter" },
        { name: "Termine" },
        { name: "Webcam" },
      ]
    }
  }
})
.component('Widget', Widget)
.component('Image', Image)
.component('Dashboard', Dashboard)
.mount('main')
