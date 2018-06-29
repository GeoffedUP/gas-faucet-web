# 0xBitcoin Gas Faucet
Simple web interface to a 0xBitcoin-dispensing smart contract. ([link](https://0x1d00ffff.github.io/gas-faucet-web/))

Smart contract code [here](https://0x1d00ffff.github.io/gas-faucet-web/).

#### BUGS

 - changing values in the gwei field causes the 'time' column to recalculate
 - "Past transactions" list occasionally fails to load

#### TODO

 - add a field for 'expected transaction cost' under the 'Gas Price' input
 - add a message for when the gas is too high
 - add community links to a header
 - add 'rate change' events to the history
 - add favicon set
 - show txhash link before transaction is confirmed, if possible
 - remove margin-right from all but the main column
 - combine contract code and site into single repo
 - naming of FaucetApp and faucet_app is confusing, use more specific variable names
 - clean up javascript code in index.html
 - move some of the vue logic from index.html to the vue app (choosing to show the error message that hides the 'submit' button for example)
 - ~~verify history is limited to 12 elements~~
 - ~~add 'deposit' events to the history~~
 - ~~improve visibility of status messages~~
 - ~~add gtag info~~

#### Misc notes

Ionicons
```
blocks: ion-ios-albums-outline, ion-ios-browsers-outline,  ion-android-apps, ion-cube
transfers: ion-ios-shuffle, ion-ios-swap-outline
calculator: ion-ios-calculator-outline
history: ion-ios-calendar-outline, ion-ios-archive-outline, ion-ios-time-outline
pie chart: ion-ios-pie-outline
bar graph: ion-ios-podium-outline, ion-ios-stats-outline
line chart: ion-ios-trending-up-outline
speed: ion-ios-stopwatch-outline, ion-ios-timer-outline
money: ion-ios-cash-outline
book: ion-ios-book-outline
social: ion-ios-chatboxes-outline, ion-ios-quote-outline, ion-ios-radio-outline
holders: ion-ios-heart-outline
explore: ion-ios-eye-outline, ion-ios-search-outline
globe: ion-ios-globe-outline
orbit: ion-ios-ionic-outline
experimental: ion-ios-flask-outline
info: ion-ios-information-circle-outline
wallet: ion-ios-key-outline, ion-ios-lock-outline
aparrel: ion-ios-shirt-outline
contract: ion-ios-paper-outline
reddit: ion-logo-reddit
```

