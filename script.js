import { createApp } from 'vue'

const Widget = {
  inject: ["widgetName"],
  props: ["name"],
  template: `<li><slot /></li>`,
  created() {
    this.widgetName(this.name)
  }
}

const Image = {
  props: ["src"],
  template: `<img :src="{{ src }}" />`
}

const Dashboard = {
  data() {
    return {
      widgets: [
      ]
    }
  },

  provide() {
    const self = this;
    return { widgetName(name) { self.widgets.push({ name }) } }
  },

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

createApp()
.component('Widget', Widget)
.component('Image', Image)
.component('Dashboard', Dashboard)
.mount('main')
