export const defaultChartOptions = {
  crosshair: {
    vertLine: {
      color: 'rgba(255, 255, 255, .75)',
      width: 0.5,
      style: 2,
      visible: true,
      labelVisible: true
    },
    horzLine: {
      color: 'rgba(255, 255, 255, .75)',
      width: 0.5,
      style: 2,
      visible: true,
      labelBackgroundColor: 'white',
      labelVisible: true
    },
    mode: 0
  },
  layout: {
    backgroundColor: 'transparent',
    textColor: 'white',
    fontFamily: 'Barlow Semi Condensed'
  },
  grid: {
    horzLines: {
      visible: false
    },
    vertLines: {
      visible: false
    }
  },
  timeScale: {
    barSpacing: 4,
    rightOffset: 12,
    lockVisibleTimeRangeOnResize: true,
    rightBarStaysOnScroll: true,
    borderVisible: true,
    borderColor: 'rgba(255, 255, 255, .2)',
    visible: true,
    timeVisible: true,
    secondsVisible: true
  },
  priceScale: {
    position: 'right',
    mode: 0,
    borderColor: 'rgba(255, 255, 255, .2)'
  },
  volumePriceScale: {
    scaleMargins: {
      top: 0.8,
      bottom: 0
    }
  }
}

export const defaultLineOptions = {
  crosshairMarkerVisible: false,
  lastValueVisible: false,
  priceLineVisible: false
}

export const defaultCandlestickOptions = {
  baseLineStyle: false,
  lastValueVisible: true,
  priceLineVisible: true,
  priceLineWidth: 1,
  priceLineColor: 'rgba(255, 255, 255, .5)',
  priceLineStyle: 2,
  priceFormat: {
    type: 'price',
    precision: 2
  },
  borderVisible: false,
  upColor: '#c3a87a',
  downColor: '#e53935',
  borderUpColor: '#c3a87a',
  borderDownColor: '#e53935',
  wickUpColor: 'rgba(223, 195, 148, .8)',
  wickDownColor: 'rgba(224, 91, 95, .8)'
}

export const defaultHistogramOptions = {
  color: '#c3a87a',
  lastValueVisible: false,
  priceLineVisible: false,
  scaleMargins: {
    top: 0.8,
    bottom: 0
  }
}

export const defaultPlotsOptions = {
  line: defaultLineOptions,
  candlestick: defaultCandlestickOptions,
  histogram: defaultHistogramOptions
}
