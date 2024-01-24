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

const Weather = {
  props: ["location"],
  data() {
    return {}
  },
  computed: {
    src() {
      return `https://wttr.in/${this.location}?0`
    }
  },
  template: `<iframe :src class=weather />`
}

const OpenSenseMap = {
  props: ["box"],
  data() {
    return { sensors: null, error: null }
  },
  created() {
    fetch(`https://api.opensensemap.org/boxes/${this.box}/sensors`)
    .then(response => response.json())
    .then(({sensors}) => {
      this.sensors = sensors.map(s => `${s.title}: ${s.lastMeasurement.value}${s.unit}`)
      this.error = null
    })
    .catch(err => {
      this.sensors = null
      this.error = err
    })
  },
  template: `
  <ul v-if="sensors">
  <li v-for="sensor in sensors">{{ sensor }}</li>
  </ul>
  <p v-else-if="error">Fehler: {{ error }}</p>
  <p v-else>Daten werden geladen …</p>
  `
}

const Events = {
  props: ["events"],
  computed: {
    sortedEvents() {
      return this.events.toSorted(({date: a}, {date: b}) => a > b ? 1 : -1)
    }
  },
  methods: {
    days_diff(date) {
      const diff = (Date.parse(date) - Date.now()) / 1000 / 60 / 60
      if (diff < -16) {
        return 'der Vergangenheit'
      } else if (diff < 18) {
        return 'diesem Moment'
      } else if (diff < 36) {
        return 'einem Tag'
      } else {
        return Math.floor(diff / 24) + '&nbsp;Tagen'
      }
    }
  },
  template: `<ul v-if=events.length>
    <li v-for="event in sortedEvents">{{event.name}} <time :datetime="event.date" tabindex=0>in <span v-html="days_diff(event.date)"/></time></li>
  </ul>
  <p v-else>Keine Termine eingetragen.</p>`
}

const Widget = {
  props: ["name", "type", "spec", "isActive", "isMaximized", "src"],
  template: `<li class="widget" :class="{ active: isActive, maximized: isMaximized }">
    <header>
    <h2>{{ name }}</h2>
    <button class="toggle-maximize" @click="$emit('toggleMaximize')" title="Maximieren" />
    </header>
    <div class=widget-body>
      <PolledImage v-if="type == 'polled-image'" :base-src="spec.baseSrc" :interval="spec.interval" />
      <Weather v-if="type == 'weather'" :location="spec.location" />
      <OpenSenseMap v-if="type == 'opensensemap'" :box="spec.box" />
      <Events v-if="type == 'events'" :events="spec.events" />
    </div>
    <footer><a v-if=src :href=src>Quelle</a></footer>
  </li>`,
}

const Dashboard = {
  props: ["initialWidgets"],
  data() {
    return {
      widgets: this.initialWidgets.map(w => ({id: w.name.toLowerCase(), ...w})),
      activeWidget: null,
      activeWidgetTimeout: null,
      maximized: null,
      asideHover: false,
    }
  },

  methods: {
    toggleMaximize(id) {
      this.maximized = this.maximized === id ? null : id
    },

    sidebarClick(id) {
      if (this.widgets[0].id === id) {
        this.activeWidget = id
        clearTimeout(this.activeWidgetTimeout)
        this.activeWidgetTimeout = setTimeout(() => {
          this.activeWidget = null
        }, 200)
      } else {
        this.widgets.splice(0, 0, ...this.widgets.splice(this.widgets.findIndex(w => w.id == id), 1))
      }
    }
  },

  template: `
    <div class=dashboard :class="{ 'has-maximized': maximized !== null, 'aside-hover': asideHover }">
      <article class=main-area>
        <TransitionGroup name="list" tag="ul">
          <Widget v-for="widget in widgets" :key="widget.id" :name="widget.name" :type="widget.type" :spec="widget.spec" :src="widget.src"
            :is-active="activeWidget == widget.id" :is-maximized="maximized == widget.id" @toggleMaximize="toggleMaximize(widget.id)"
          />
        </TransitionGroup>
      </article>
      <aside @mouseenter="asideHover=true" @mouseleave="asideHover=false">
        <nav>
          <TransitionGroup name="list" tag="ul">
            <li v-for="widget in widgets" :key="widget.id" class="sidebar-item-container"><a class=sidebar-item @click="sidebarClick(widget.id)"><span>{{ widget.name }}</span></a></li>
          </TransitionGroup>
        </nav>
      </aside>
    </div>
`}

createApp({
  data() {
    return {
      widgets: [
        {name: "Wetter", src: "https://wttr.in/52.47,13.39", type: "weather", spec: {location: "52.47,13.39"}},
        {name: "Termine", type: "events", spec: {events: [
          {date: '2024-03-08', name: 'Frauenkampftag'},
          {date: new Date().toISOString().substr(0, 10), name: 'Heute'},
          {date: '2024-05-08', name: 'Tag der Befreiung'},
          {date: '2023-12-31', name: 'Silvester'},
          {date: '2024-05-25', name: 'Towel Day'},
          {date: '2024-05-04', name: 'Star Wars Day'},
        ]}},
        {name: "Aussicht", src: "https://www.spacesquad.de/livecam/", type: "polled-image", spec: {baseSrc: "https://cam.spacesquad.de/images/live.jpg", interval: 5}},
        {name: "Sensor", src: "https://opensensemap.org/explore/5bf93ceba8af82001afc4c32", type: "opensensemap", spec: {box: "5bf93ceba8af82001afc4c32"}},
      ]
    }
  }
})
.component('Widget', Widget)
.component('PolledImage', PolledImage)
.component('Dashboard', Dashboard)
.component('Weather', Weather)
.component('OpenSenseMap', OpenSenseMap)
.component('Events', Events)
.mount('main')
