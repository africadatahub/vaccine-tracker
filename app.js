import Vue from 'vue/dist/vue.esm.js'
let numberFormat = new Intl.NumberFormat()

let colors = [
  '#8dd3c7',
  '#bebada',
  '#fb8072',
  '#80b1d3',
  '#fdb462',
  '#b3de69',
  '#fccde5',
  '#d9d9d9',
  '#bc80bd',
  '#ccebc5',
  '#ffed6f',
]

Vue.filter('formatNumber', function (value) {
  return numberFormat.format(value)
})

const vm = new Vue({
  el: '#app',
  data() {
    return {
      data: [],
      countries: [],
      countryData: {},
      isoCodes: {},
      vaccinations: [],
      covax: [],
      vaccines: [],
      deliveries: [],
      populations: [],
    }
  },
  methods: {
    async getIso() {
      await fetch('https://api.mediahack.co.za/adh/iso-json.php')
        .then((data) => data.json())
        .then((data) => {
          data.forEach((d) => {
            this.isoCodes[d['alpha-3']] = d
          })
        })
    },
    async getData() {
      await fetch('https://api.mediahack.co.za/adh/populations-json.php')
        .then((data) => data.json())
        .then((data) => {
          this.populations = data.filter((d) => d.continent === 'Africa')
        })

      await fetch('https://api.mediahack.co.za/adh/vaccine-deliveries-json.php')
        .then((data) => data.json())
        .then((data) => {
          this.deliveries = data.filter((d) => d.continent === 'Africa')
        })
      await fetch('https://api.mediahack.co.za/adh/covax-deliveries-json.php')
        .then((data) => data.json())
        .then((data) => {
          this.covax = data
        })
      await fetch('https://api.mediahack.co.za/adh/countries-json.php')
        .then((data) => data.json())
        .then((data) => {
          this.vaccinations = data.filter((d) => d.continent === 'Africa')
          this.vaccines = [
            ...new Set(this.vaccinations.map((x) => x.common_name)),
          ]
        })
      await fetch('https://api.mediahack.co.za/adh/mhc-vaccinations.php')
        .then((data) => data.json())
        .then((data) => {
          this.data = data.sort((a, b) => (a.country > b.country ? 1 : -1))
          this.countries = [...new Set(data.map((x) => x.iso_code))]

          this.countries.forEach((d) => {
            d.trim()

            let vacs = this.vaccinations.filter((v) => v.iso_code === d)
            let vs = []
            vacs.forEach((e) => {
              if (e.vaccination_started === 'Yes') {
                let index = this.vaccines.indexOf(e.common_name)
                let color = colors[index]
                vs.push({
                  vacName: e.common_name,
                  color: color,
                })
              }
            })

            let countryDetails = data.filter((e) => e.iso_code === d)

            let countryName = ''
            if (countryDetails[0].country == 'Democratic Republic of Congo') {
              countryName = 'Democratic Rep. of Congo'
            } else {
              countryName = countryDetails[0].country
            }
            let dCountry = this.deliveries.filter(
              (del) => del.iso_code === d && del.doses_received !== ''
            )
            let deliveryCount = 0
            dCountry.forEach((c) => {
              deliveryCount = deliveryCount + +c.doses_received
            })

            let pop = this.populations.filter((p) => p.iso_code === d)
            let popRatio =
              (countryDetails[0].total_vaccine_doses_to_date /
                +pop[0].population) *
              100

            this.countryData[d] = {
              country: countryName,
              isoCode: d,
              isoCodeTwo: this.isoCodes[d]['alpha-2'],
              flagImage: this.isoCodes[d]['alpha-2'].toLowerCase() + '.png',
              totalVaccinations: countryDetails[0].total_vaccine_doses_to_date,
              lastUpdate: countryDetails[0].date_of_report,
              allData: countryDetails,
              vaccinations: vs,
              deliveries: deliveryCount,
              population: pop[0].population,
              popRatio: popRatio.toFixed(1),
            }
          })
        })
    },
    // countryData(iso) {
    //   return this.data.filter((d) => d.iso_code === iso)
    // },
  },
  mounted() {
    this.getIso().then(() => {
      this.getData()

      // set card heights
      setTimeout(() => {
        let cardHeight = 0
        let cards = document.querySelectorAll('.card')

        cards.forEach((d) => {
          if (d.offsetHeight > cardHeight) {
            cardHeight = d.offsetHeight
          }
        })

        cards.forEach((d) => {
          d.style.height = cardHeight + 'px'
        })
      }, 1000)
    })
  },
})
