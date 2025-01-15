![pikachu-removebg-preview](https://github.com/user-attachments/assets/ef7dddd4-0783-4258-8a4b-8a17798f379f)

# Pokesearch

Pokesearch is a simple static website that allows users to easily find basic information about Pokémon.

![Pokesearch Demo](https://user-images.githubusercontent.com/99931537/234955223-d7404cbf-889d-4cbd-b138-3b3d17d8e0aa.mov)

## API

To fetch Pokémon information, Pokesearch utilizes the [PokéAPI](https://pokeapi.co), which provides comprehensive data about Pokémon species.

## HTTP Client

Requests are made using a promise-based HTTP client, which is isomorphic and can run in both browser and Node.js environments.

## Installation and Setup

1. Clone the repository:
  ```sh
   git clone https://github.com/andresafag/pokemon.git
   ```
2. Install the dependencies
  ```sh
   npm install
   ```
3. Run it 
  ```sh
   node server.js
   ```
4. Pull up the browser and enter localhost:10000
   
https://user-images.githubusercontent.com/99931537/234955223-d7404cbf-889d-4cbd-b138-3b3d17d8e0aa.mov


In order to seek pokemon information I made use of a very useful API [pokemon api](https://pokeapi.co) which provided all the necessary information about pokemon species.

I made the requests using a promise-based HTTP Client for, in this case, the browser. It is an isomorphic module that can be running in browser/node.js side I highly recommend which prupose is to make requests and handle response in a very easy way [axios](https://axios-http.com/docs/intro).
