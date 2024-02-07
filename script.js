import { createApp } from 'vue'

const PolledImage = {
  expose: ["refresh"],
  props: ["baseSrc", "interval"],
  data() {
    return {
      lastRefreshed: null,
      refreshTimeout: null,
    }
  },
  mounted() {
    this.refresh()
  },
  unmounted() {
    clearTimeout(this.refreshTimeout)
  },
  methods: {
    refresh() {
      clearTimeout(this.refreshTimeout)
      this.lastRefreshed = Date.now()
      this.refreshTimeout = setTimeout(() => this.refresh(), this.interval * 60 * 1000)
    }
  },
  computed: {
    src() {
      return `${this.baseSrc}?t=${this.lastRefreshed}`
    }
  },
  template: `<img :src @load="$emit('refreshed', lastRefreshed)" @error="$emit('refreshed', lastRefreshed)" />`
}

const Weather = {
  expose: ["refresh"],
  props: ["location"],
  data() {
    return {
      lastRefreshed: null,
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.lastRefreshed = Date.now()
    }
  },
  computed: {
    src() {
      return `https://wttr.in/${this.location}?0&time=${this.lastRefreshed}`
    }
  },
  template: `<iframe :src class="weather" @load="$emit('refreshed', lastRefreshed)" @error="$emit('refreshed', lastRefreshed)" />`
}

const OpenSenseMap = {
  expose: ["refresh"],
  props: ["box"],
  data() {
    return { sensors: null, error: null, abort: new AbortController }
  },
  created() {
    this.refresh()
  },
  unmounted() {
    this.abort.abort()
  },
  methods: {
    async refresh() {
      try {
        this.abort.abort()
        this.abort = new AbortController;
        this.error = null // Reset error early to show loading message
        const response = await fetch(`https://api.opensensemap.org/boxes/${this.box}/sensors`,  { signal: this.abort.signal })
        const {sensors} = await response.json()
        this.sensors = sensors.map(({ title, lastMeasurement: { value }, unit}) => ({ title, value, unit }))
      } catch (err) {
        if (err.name === 'AbortError') { console.log('aborted'); return; }
        this.sensors = null
        this.error = err
      }
      this.$emit('refreshed', Date.now())
    },
  },
  template: `
  <ul v-if="sensors">
    <li v-for="sensor in sensors">{{ sensor.title }}: {{ sensor.value }}{{ sensor.unit }}</li>
  </ul>
  <p v-else-if="error">Fehler: {{ error }}</p>
  <p v-else>Daten werden geladen …</p>
  `
}

const Events = {
  expose: ["refresh"],
  props: ["events"],
  data() {
    return { refTime: Date.now() }
  },
  computed: {
    sortedEvents() {
      return this.events.toSorted(({date: a}, {date: b}) => a > b ? 1 : -1)
    }
  },
  methods: {
    refresh() {
      this.refTime = Date.now()
      this.$emit('refreshed', this.refTime)
    },
    days_diff(date) {
      const diff = (Date.parse(date) - this.refTime) / 1000 / 60 / 60
      if (diff < -24) {
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
  template: `<ul v-if="events.length">
    <li v-for="event in sortedEvents">{{event.name}} <time :datetime="event.date" tabindex="0">(in <span v-html="days_diff(event.date)"/>)</time></li>
  </ul>
  <p v-else>Keine Termine eingetragen.</p>`
}

const Clock = {
  expose: ["refresh"],
  props: [],
  data() {
    return {
      time: null,
      refreshTimeout: null,
    }
  },
  created() {
    this.refresh()
  },
  unmounted() {
    clearTimeout(this.refreshTimeout)
  },
  methods: {
    newTimeout() {
      // A somewhat gaussian number distribution
      // from https://stackoverflow.com/a/39187274
      function gaussianRand() {
        let rand = 0
        for (let i = 0; i < 6; i += 1) {
          rand += Math.random()
        }
        return rand / 6
      }

      clearTimeout(this.refreshTimeout)
      // A random timeout for a broken-looking clock
      const timeout = Math.abs(gaussianRand() - 0.5) * 15 * 1000 + 1000
      this.refreshTimeout = setTimeout(() => this.refresh(), timeout)
    },
    refresh() {
      this.newTimeout()
      this.time = new Date
      this.$emit('refreshed', this.time.getTime())
    }
  },
  template: `
  <div class="fluid-container">
    <Transition name="update-clock">
      <p :key="time" class="fluid-typography">{{ time.toLocaleTimeString() }}</p>
    </Transition>
  </div>
  `
}

const Widget = {
  props: ["name", "type", "spec", "active", "maximized", "src"],
  data() {
    return { lastRefreshed: Date.now(), refreshing: false }
  },
  methods: {
    async refresh() {
      this.refreshing = true;
      this.$refs.child.refresh()
    },
    onRefreshed(n) {
      this.lastRefreshed = n
      this.refreshing = false;
    }
  },
  computed: {
    formattedTime() {
      const date = new Date(this.lastRefreshed)
      return date.toLocaleTimeString()
    }
  },
  template: `<li class="widget" :class="{ active, maximized, refreshing }">
    <header>
    <h2>{{ name }}</h2>
    <button class="toggle-maximize" @click="$emit('toggleMaximize')">Maximieren</button>
    </header>
    <div class="widget-body">
      <component :is="type" v-bind="spec" ref="child" @refreshed="onRefreshed" />
    </div>
    <footer>
      <span>
      <a class="refresh" @click="refresh">Neu laden</a>
      (Stand: {{formattedTime}})
      </span>
      <a v-if="src" :href="src" class="src">Quelle</a>
    </footer>
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
    <div class="dashboard" :class="{ 'has-maximized': maximized !== null, 'aside-hover': asideHover }">
      <main class="main-area">
        <TransitionGroup name="list" tag="ul">
          <Widget v-for="widget in widgets" :key="widget.id" v-bind="widget"
            :active="activeWidget == widget.id" :maximized="maximized == widget.id" @toggleMaximize="toggleMaximize(widget.id)"
          />
        </TransitionGroup>
      </main>
      <aside @mouseenter="asideHover=true" @mouseleave="asideHover=false">
        <nav>
          <TransitionGroup name="list" tag="ul">
            <li v-for="widget in widgets" :key="widget.id" class="sidebar-item-container"><a class="sidebar-item" @click="sidebarClick(widget.id)"><span>{{ widget.name }}</span></a></li>
          </TransitionGroup>
        </nav>
      </aside>
    </div>
`}

createApp({
  data() {
    return {
      widgets: [
        {name: "Zeit", type: "Clock", spec: {}},
        {name: "Wetter", src: "https://wttr.in/52.47,13.39", type: "Weather", spec: {location: "52.47,13.39"}},
        {name: "Termine", type: "Events", spec: {events: [
          {date: '2024-03-08', name: 'Frauenkampftag'},
          {date: new Date().toISOString().substr(0, 10), name: 'Heute'},
          {date: '2024-05-08', name: 'Tag der Befreiung'},
          {date: '2023-12-31', name: 'Silvester'},
          {date: '2024-05-25', name: 'Towel Day'},
          {date: '2024-05-04', name: 'Star Wars Day'},
        ]}},
        {name: "Aussicht", src: "https://www.spacesquad.de/livecam/", type: "PolledImage", spec: {baseSrc: "https://cam.spacesquad.de/images/live.jpg", interval: 2}},
        {name: "Sensor", src: "https://opensensemap.org/explore/5bf93ceba8af82001afc4c32", type: "OpenSenseMap", spec: {box: "5bf93ceba8af82001afc4c32"}},
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
.component('Clock', Clock)
.mount('#root')
