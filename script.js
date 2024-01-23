import { createApp } from 'vue'

const Image = {
  props: ["src"],
  template: `<img :src="src" />`
}

const Widget = {
  props: ["name", "type", "spec"],
  template: `<li>
    <Image v-if="type == 'image'" :src="spec.src" />
  </li>`,
}

const Dashboard = {
  props: ["widgets"],
  data() {
    return {
    }
  },

  template: `
    <article>
      <ul class=dashboard>
        <Widget v-for="widget in widgets" :name="widget.name" :type="widget.type" :spec="widget.spec" />
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
