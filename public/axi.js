let btn =  document.querySelector('.btn'),
    input =  document.querySelector('.input')

btn.addEventListener('click', function(e){
  e.preventDefault()

    const getData = async()=>{
      // Variabes needed initiated
      let response1 =  await axios.get(`https://pokeapi.co/api/v2/pokemon/${input.value.toLowerCase()}/`) // axios request # 1
          response2 = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${input.value.toLowerCase()}/`) // axios request # 1
          cardCover = document.querySelector('.cardCover'),
          cardContainer = document.createElement('div'),
          contentContainer = document.createElement('div'),
          imgcontainer = document.createElement('div'),
          img = document.createElement('img'),
          itemContainer = document.createElement('div')

      // Adding classes to the DOM elements of the cardCover
      cardCover.classList.toggle("cardCoverVisible")
      img.className = "imgstyle"
      contentContainer.className = 'contentCard'
      cardContainer.className = "cardContainer"
      imgcontainer.className = 'imgcontainer'
      itemContainer.className = 'itemContainer'

      // Appending the elements created for the card and ataching the API information to it 
      cardCover.appendChild(cardContainer)
      cardContainer.appendChild(contentContainer)
      contentContainer.appendChild(imgcontainer)
      imgcontainer.appendChild(img)
      contentContainer.appendChild(itemContainer)

      // getting the image names
      if (response1.data.id < 10) {
        img.src = `./downloads/00${response1.data.id}.png`
      } else if (response1.data.id < 100) {
        img.src = `./downloads/0${response1.data.id}.png`
      } else {
        img.src = `./downloads/${response1.data.id}.png`
      }

      // HTML code
      itemContainer.innerHTML = `<div><h2>Pokemon information</h2></div> <div><p><strong>Name: </strong>${response1.data.name}<p><p><strong>Height: </strong>${response1.data.height}<p> <p><strong>Weight: </strong>${response1.data.weight}<p> <div><strong>Skills: </strong></div> <ul class='ul'></ul> <p><strong>Color: </strong>${response2.data.color.name}</p> <p class='evolvedFrom'></p> <p class='habitat'></p> <p><strong>Shape: </strong>${response2.data.shape.name}</p> <p><strong>Type: </strong>${response2.data.genera[7].genus}</p></div>`

      let ul = document.querySelector('.ul'),
          evolution = document.querySelector('.evolvedFrom'),
          habitat = document.querySelector('.habitat')


        // Looping through some data in arrays
        for (var i = 0; i < response1.data.abilities.length; i++) {
          let li = document.createElement('li')
          ul.appendChild(li)
          li.innerHTML += `${response1.data.abilities[i]["ability"].name}`
        }

        if (response2.data.evolves_from_species) {
          evolution.innerHTML = `<strong>Evolved from: </strong>${response2.data.evolves_from_species.name}`
        } else {
          evolution.innerHTML = `<strong>Evolved from:</strong> No previous evolution`
        }

        if (response2.data.habitat) {
          habitat.innerHTML = `<strong>habitat: </strong>${response2.data.habitat.name}`
        } else {
          habitat.innerHTML = `<strong>Habitat:</strong> Unknown habitat`
        }

        response2.data.egg_groups.forEach((item) => {
          console.log(`Estos son los tipo de huevos ${item.name}`);
        });



        // Closing cross to dissapear the card
        let closeBox = document.createElement('div')
        cardCover.append(closeBox)
        closeBox.classList.add('closeBox')
        closeBox.innerHTML = "<i class='fa-solid fa-circle-xmark' style='font-size:45px;'></i>"
        closeBox.addEventListener('click', function(){
          cardCover.classList.toggle("cardCoverVisible")
          cardCover.textContent = ''
        })
      }

  getData()

})
