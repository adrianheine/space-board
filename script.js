import { createApp } from 'vue'

const PolledImage = {
  expose: ["refresh"],
  props: ["baseSrc", "interval"],
  data() {
    return {
      src: this.baseSrc + '?t=' + Date.now(),
      refreshTimeout: null,
    }
  },
  mounted() {
    this.refreshTimeout = setTimeout(() => this.refresh(), this.interval * 60 * 1000)
  },
  methods: {
    refresh() {
      clearTimeout(this.refreshTimeout)
      const lastRefreshed = Date.now()
      this.src = this.baseSrc + '?t=' + lastRefreshed
      this.$emit('refreshed', lastRefreshed)
      this.refreshTimeout = setTimeout(() => this.refresh(), this.interval * 60 * 1000)
      return lastRefreshed
    }
  },
  template: `<img :src="src" />`
}

const Weather = {
  expose: ["refresh"],
  props: ["location"],
  data() {
    return { src: `https://wttr.in/${this.location}?0` }
  },
  methods: {
    refresh() {
      const lastRefreshed = Date.now()
      this.src = `https://wttr.in/${this.location}?0&time=` + lastRefreshed
      return lastRefreshed
    }
  },
  template: `<iframe :src class=weather ref=iframe />`
}

const OpenSenseMap = {
  expose: ["refresh"],
  props: ["box"],
  data() {
    return { sensors: null, error: null }
  },
  created() {
    this.refresh()
  },
  methods: {
    refresh() {
      return fetch(`https://api.opensensemap.org/boxes/${this.box}/sensors`)
      .then(response => response.json())
      .then(({sensors}) => {
        this.sensors = sensors.map(s => `${s.title}: ${s.lastMeasurement.value}${s.unit}`)
        this.error = null
      })
      .catch(err => {
        this.sensors = null
        this.error = err
      })
      .then(() => Date.now())
    },
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
      return this.refTime
    },
    days_diff(date) {
      const diff = (Date.parse(date) - this.refTime) / 1000 / 60 / 60
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

const Clock = {
  expose: ["refresh"],
  props: [],
  data() {
    return {
      time: new Date,
      refreshTimeout: null,
    }
  },
  mounted() {
    this.newTimeout()
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
      return this.time.getTime()
    }
  },
  template: `
  <div class=fluid-container>
    <Transition name=update-clock>
      <p :key=time class=fluid-typography>{{ time.toLocaleTimeString() }}</p>
    </Transition>
  </div>
  `
}

const Widget = {
  props: ["name", "type", "spec", "isActive", "isMaximized", "src"],
  data() {
    return { lastRefreshed: Date.now() }
  },
  methods: {
    async refresh() {
      this.lastRefreshed = await this.$refs.child.refresh()
    },
  },
  computed: {
    formattedTime() {
      const date = new Date(this.lastRefreshed)
      return date.toLocaleTimeString()
    }
  },
  template: `<li class="widget" :class="{ active: isActive, maximized: isMaximized }">
    <header>
    <h2>{{ name }}</h2>
    <button class="toggle-maximize" @click="$emit('toggleMaximize')" title="Maximieren" />
    </header>
    <div class=widget-body>
      <PolledImage v-if="type == 'polled-image'" :base-src="spec.baseSrc" :interval="spec.interval" ref=child @refreshed="n => lastRefreshed = n" />
      <Weather v-if="type == 'weather'" :location="spec.location" ref=child />
      <OpenSenseMap v-if="type == 'opensensemap'" :box="spec.box" ref=child />
      <Events v-if="type == 'events'" :events="spec.events" ref=child />
      <Clock v-if="type == 'clock'" ref=child @refreshed="n => lastRefreshed = n" />
    </div>
    <footer>
      <span>
      <a class=refresh @click=refresh>Neu laden</a>
      (Stand: {{formattedTime}})
      </span>
      <a v-if=src :href=src class=src>Quelle</a>
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
        {name: "Zeit", type: "clock", spec: {}},
        {name: "Wetter", src: "https://wttr.in/52.47,13.39", type: "weather", spec: {location: "52.47,13.39"}},
        {name: "Termine", type: "events", spec: {events: [
          {date: '2024-03-08', name: 'Frauenkampftag'},
          {date: new Date().toISOString().substr(0, 10), name: 'Heute'},
          {date: '2024-05-08', name: 'Tag der Befreiung'},
          {date: '2023-12-31', name: 'Silvester'},
          {date: '2024-05-25', name: 'Towel Day'},
          {date: '2024-05-04', name: 'Star Wars Day'},
        ]}},
        {name: "Aussicht", src: "https://www.spacesquad.de/livecam/", type: "polled-image", spec: {baseSrc: "https://cam.spacesquad.de/images/live.jpg", interval: 2}},
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
.component('Clock', Clock)
.mount('main')
