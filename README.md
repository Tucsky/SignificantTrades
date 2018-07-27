A **heavily** modified version of [beastlybeast's SignificantTrades](https://github.com/beastlybeast/SignificantTrades) with multi exchanges / pairing support & chart visualizer.<br/>
I did that mostly for fun and training, but combining many exchanges data together is kind of interesting to see. 

# SignificantTrades [![Build Status](https://travis-ci.org/Tucsky/SignificantTrades.svg?branch=master)](https://travis-ci.org/Tucsky/SignificantTrades)
Live trades visualizer.<br>
Currently supporting Bitstamp, Kraken, Huobi, Hitbtc, Okex, Bitmex, Binance, Bitfinex, Gdax ([see server/src/exchanges/](server/src/exchanges))

![screenshot](https://i.imgur.com/j3iP8ds.gif)

## How it works
- The repo contains a server part to gather & format exchanges data and broadcast it to many clients through websocket (mostly) communication.
- The client part is written in vue.js, show live trades in a list based on settings (short timeframe row stacking by amount) and allow to visualize session's buys/sells/price in a little chart (which tick from 10s to 1d depending on zoom, so mostly 10s). It also can control the server so it knows which pair to track.

## What it do
- Aggregate trades from exchanges on a specific pair (default BTCUSD)
- Filter trades by amount (by stacking them up)
- Show realtime BUY & SELL volume & average price on a chart
- Load previous trade data on the chart
- Range selection (`shift + clic` the chart)

Check out [the demo](https://tucsky.github.io/SignificantTrades/)

## How to install & run locally
1. Clone the repo

```bash
git clone https://github.com/Tucsky/SignificantTrades
```

2. Install server dependencies

```bash
Run "Run First.bat"
Remove the "Example" From config name in server folder
```

3. Install client dependencies then run

```bash
Run "Run Second.bat"
```

4. Run Open Server.bat in server folder, Run Open Client.bat in Client Folder

5. Open a browser window at localhost:8080
...

6. Profit !

## Configuration

All settings are optional and can be changed in the [server configuration file](server/config.json.example) (rename config.json.example into config.json as the real config file is untracked on github).

```js
{
  // the port which the server will be at 
  "port": 3000, // (note that you will NEED to update the target url in [client/src/services/socket.js](client/src/services/socket.js))
  
  // delay (in ms) between server broadcasts to avoid large
  "delay": 200, // (the larger the better performance wise)
  
  // default pair it should use 
  "pair": "BTCUSD" // (then you can change it in the client settings)
}
```

*Wanna contribute ?*<br>
- [x] Publish a demo on github ([its up!](https://tucsky.github.io/SignificantTrades/))
- [ ] Improve client performances (always room for improvements)
- [ ] Inter-exchanges volume averaged price (kind of work but [can definetly be improved](https://i.imgur.com/J5lBuWr.gif)
- [ ] Alerts & push notifications
- [ ] Support more exchanges
- [ ] Multiple channels monitoring at once

*Like whats been done here ?* Donate BTC (segwit)<br>
[3GLyZHY8gRS96sH4J9Vw6s1NuE4tWcZ3hX](bitcoin:3GLyZHY8gRS96sH4J9Vw6s1NuE4tWcZ3hX)
